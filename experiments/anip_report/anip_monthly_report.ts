// Office Script — roda no botão "Automatizar" do Excel (aba ligada ao arquivo Base ANIP 2026.xlsx).
//
// Fluxo: loga no ANIP (SharePoint FBA) -> abre MonthlyReport.aspx -> extrai ReportSession/ControlID
// do HTML renderizado -> chama o endpoint de export CSV do ReportViewer -> escreve os 3 valores
// (Sales-Replacement, Sales-Original Equipment, Import Qtd) por segmento na aba do mês correspondente.
//
// ATENCAO — riscos conhecidos, ainda nao testados:
// 1. Usuario/senha ficam em texto no corpo do script. Qualquer pessoa com edicao nesta planilha
//    consegue ler suas credenciais do ANIP. Aceito pelo usuario, mas documentado aqui.
// 2. fetch() do Office Script roda em sandbox e pode nao manter cookies de sessao automaticamente
//    entre chamadas/redirects como um navegador normal faz. Se o login falhar silenciosamente,
//    esse e o primeiro suspeito — pode ser necessario capturar o header Set-Cookie manualmente
//    e reenviar via header Cookie nas chamadas seguintes (feito abaixo, mas nao validado ainda).
// 3. O parsing do CSV (formatCsvValue) ainda depende de ver um exemplo real do arquivo exportado.

const ANIP_USERNAME = "d.bastos"; // TODO: confirmar
const ANIP_PASSWORD = "SUA_SENHA_AQUI"; // TODO: preencher — ver risco de seguranca acima

const BASE_URL = "https://matis-anip.anura.biz";
const LOGIN_URL =
  BASE_URL +
  "/_layouts/15/FBA/LOGINPAGE/LoginANIP.aspx?ReturnUrl=%2f_layouts%2f15%2fAuthenticate.aspx%3fSource%3d%252F&Source=%2f";
const REPORT_URL = BASE_URL + "/MIC/Pages/MonthlyReport.aspx";

const MESES_PT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
];

interface SegmentRow {
  code: string; // "1000", "2000", ...
  replacement: number;
  originalEquipment: number;
  import: number;
}

function extractHiddenField(html: string, fieldName: string): string {
  const regex = new RegExp(`id="${fieldName}"[^>]*value="([^"]*)"`);
  const match = html.match(regex);
  if (!match) {
    throw new Error(`Campo oculto ${fieldName} nao encontrado na pagina de login.`);
  }
  return match[1];
}

function collectSetCookies(response: Response): string[] {
  // Office Script Response nao expoe getSetCookie() nativamente em toda versao;
  // isso e o ponto mais provavel de quebrar. Se headers.get("set-cookie") vier vazio,
  // precisamos de outra estrategia (ver notas no topo do arquivo).
  const raw = response.headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,(?=[^;]+?=)/).map((c: string) => c.split(";")[0].trim());
}

function mergeCookies(existing: Record<string, string>, setCookies: string[]): void {
  for (const cookie of setCookies) {
    const eq = cookie.indexOf("=");
    if (eq === -1) continue;
    const name = cookie.substring(0, eq);
    const value = cookie.substring(eq + 1);
    existing[name] = value;
  }
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function login(cookies: Record<string, string>): Promise<void> {
  const getResp = await fetch(LOGIN_URL, { method: "GET" });
  mergeCookies(cookies, collectSetCookies(getResp));
  const html = await getResp.text();

  const viewState = extractHiddenField(html, "__VIEWSTATE");
  const viewStateGenerator = extractHiddenField(html, "__VIEWSTATEGENERATOR");
  const eventValidation = extractHiddenField(html, "__EVENTVALIDATION");

  const body = new URLSearchParams({
    __LASTFOCUS: "",
    __EVENTTARGET: "",
    __EVENTARGUMENT: "",
    __VIEWSTATE: viewState,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    __EVENTVALIDATION: eventValidation,
    "ctl00$PlaceHolderMain$signInControl$UserName": ANIP_USERNAME,
    "ctl00$PlaceHolderMain$signInControl$password": ANIP_PASSWORD,
    "ctl00$PlaceHolderMain$signInControl$login": "Sign In"
  });

  const postResp = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader(cookies)
    },
    body: body.toString()
  });
  mergeCookies(cookies, collectSetCookies(postResp));

  if (!postResp.ok && postResp.status !== 302) {
    throw new Error(`Login falhou. Status: ${postResp.status}`);
  }
}

async function loadReportAndGetSessionInfo(
  cookies: Record<string, string>
): Promise<{ reportSession: string; controlId: string; periodLabel: string }> {
  const resp = await fetch(REPORT_URL, {
    method: "GET",
    headers: { "Cookie": cookieHeader(cookies) }
  });
  mergeCookies(cookies, collectSetCookies(resp));
  const html = await resp.text();

  const sessionMatch = html.match(/ReportSession=([a-z0-9]+)/i);
  const controlMatch = html.match(/ControlID=([a-f0-9]+)/i);
  const periodMatch = html.match(/Period:\s*(\d{4})\s*-\s*(\w+)/i);

  if (!sessionMatch || !controlMatch) {
    throw new Error("Nao foi possivel extrair ReportSession/ControlID da pagina. Login pode ter falhado.");
  }
  if (!periodMatch) {
    throw new Error("Nao foi possivel extrair o periodo (ano/mes) do relatorio.");
  }

  return {
    reportSession: sessionMatch[1],
    controlId: controlMatch[1],
    periodLabel: periodMatch[2] // ex: "August"
  };
}

async function exportCsv(
  cookies: Record<string, string>,
  reportSession: string,
  controlId: string
): Promise<string> {
  const exportUrl =
    `${BASE_URL}/Reserved.ReportViewerWebControl.axd?ReportSession=${reportSession}` +
    `&Culture=2057&CultureOverrides=False&UICulture=1033&UICultureOverrides=True&ReportStack=1` +
    `&ControlID=${controlId}&OpType=Export&FileName=MonthlyReport&ContentDisposition=OnlyHtmlInline&Format=CSV`;

  const resp = await fetch(exportUrl, {
    method: "GET",
    headers: { "Cookie": cookieHeader(cookies) }
  });
  if (!resp.ok) {
    throw new Error(`Export CSV falhou. Status: ${resp.status}`);
  }
  return await resp.text();
}

// Formato real confirmado (ex.):
//   textbox79,textbox85,textbox86,Textbox5
//    1000 - TRUCK/BUSES,"324,253 ","172,628 ","6,264"
//    4000 - TWO WHEELS,"658,512 ", ,"32,059"
// Primeira coluna (segmento) nunca tem aspas. As demais vem entre aspas quando tem
// separador de milhar (virgula, formato US), sem aspas quando o valor cabe sem virgula,
// e campos vazios aparecem como um espaco em branco (ou nada) sem aspas.
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(csvText: string): SegmentRow[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows: SegmentRow[] = [];

  const toNumber = (s: string | undefined) => {
    const cleaned = (s || "").replace(/,/g, "").trim();
    return cleaned === "" ? 0 : Number(cleaned);
  };

  for (const line of lines) {
    const cols = splitCsvLine(line);
    const segmentLabel = cols[0]?.trim();
    const codeMatch = segmentLabel?.match(/^(\d{4})/);
    if (!codeMatch) continue; // pula cabecalho (textbox79,...) ou linhas nao-segmento

    rows.push({
      code: codeMatch[1],
      replacement: toNumber(cols[1]),
      originalEquipment: toNumber(cols[2]),
      import: toNumber(cols[3])
    });
  }

  return rows;
}

function monthAbbrevFromEnglish(periodLabel: string): string {
  const map: Record<string, string> = {
    January: "JAN", February: "FEV", March: "MAR", April: "ABR",
    May: "MAI", June: "JUN", July: "JUL", August: "AGO",
    September: "SET", October: "OUT", November: "NOV", December: "DEZ"
  };
  const abbrev = map[periodLabel];
  if (!abbrev) throw new Error(`Mes nao reconhecido: ${periodLabel}`);
  return abbrev;
}

// Segmento -> linha na aba, conforme o layout atual (B5:B11).
const SEGMENT_ROW: Record<string, number> = {
  "1000": 5, "2000": 6, "3000": 7, "4000": 8,
  "5000": 9, "6000": 10, "7000": 11
};

async function main(workbook: ExcelScript.Workbook) {
  const cookies: Record<string, string> = {};

  await login(cookies);
  const { reportSession, controlId, periodLabel } = await loadReportAndGetSessionInfo(cookies);
  const csvText = await exportCsv(cookies, reportSession, controlId);
  const rows = parseCsv(csvText);

  const sheetName = monthAbbrevFromEnglish(periodLabel);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Aba "${sheetName}" nao encontrada na planilha.`);
  }

  for (const row of rows) {
    const excelRow = SEGMENT_ROW[row.code];
    if (!excelRow) continue;

    sheet.getRange(`D${excelRow}`).setValue(row.replacement);
    sheet.getRange(`E${excelRow}`).setValue(row.originalEquipment);
    sheet.getRange(`F${excelRow}`).setValue(row.import);
  }
}
