"""Monta hub/index.html a partir de hub.src.html, inlinando o design system e as séries dos sparklines."""
import json, pathlib, sys
here = pathlib.Path(__file__).parent
ds = here.parent / "design-system"
spark = pathlib.Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else (here / "spark.json").read_text()
src = (here / "hub.src.html").read_text()
out = (src.replace("/*@@IMCSS@@*/", (ds / "im-ds.css").read_text())
          .replace("/*@@IMJS@@*/", (ds / "im-ds.js").read_text())
          .replace("/*@@SPARK@@*/", spark.strip()))
(here / "index.html").write_text(out)
print("ok", len(out))
