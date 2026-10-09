import csv, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((ROOT/'sample_data/enquiries.csv').open(encoding='utf-8')))
results=[]
for row in rows:
    message=row['message'][:3000]
    low=message.lower()
    if any(x in low for x in ['appointment','booking','schedule']): category='appointments'
    elif any(x in low for x in ['quote','price','cost']): category='quotation'
    else: category='general'
    results.append({'id':row['id'],'category':category,'draft':f"Thanks for your enquiry. We received your request about {category}. Could you share the relevant details and preferred timeline? A team member will review this before any reply is sent.",'review_required':True})
out=ROOT/'output';out.mkdir(exist_ok=True)
(out/'report.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(f'Processed {len(results)} sample enquiries; all require human review.')
