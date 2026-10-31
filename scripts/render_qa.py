import pypdfium2 as pdfium
from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'tmp';out.mkdir(exist_ok=True)
pdf=pdfium.PdfDocument(str(root/'data/originals/doc-1.pdf'))
for p in [218,220,375]:
 im=pdf[p].render(scale=1.3).to_pil();im.save(out/f'page-{p+1}.png')
pages=[1,2,4,8,10,24,26,231,233,493]
sheet=Image.new('RGB',(1000,560),'#ddd');d=ImageDraw.Draw(sheet)
for i,p in enumerate(pages):
 im=pdf[p-1].render(scale=.3).to_pil();im.thumbnail((190,245));x=i%5*200;y=i//5*280;sheet.paste(im,(x,y+24));d.text((x+5,y+5),str(p),fill='black')
sheet.save(out/'low-text-pages.png')
