# CMS-1500 Health Insurance Claim Form

The **CMS-1500 (02/12)** is the standard claim form used by non-institutional
healthcare providers in the US to bill Medicare, Medicaid, and most private
insurance carriers. Its layout is maintained by the National Uniform Claim
Committee (NUCC).

## What's in this dataset

| File                         | Description                                                                                       |
|------------------------------|---------------------------------------------------------------------------------------------------|
| `form.json`                  | SurveyJS schema (14 pages, ~95 fields). Field names follow a `box{NN}{letter}.field` convention so the data maps 1:1 back to the paper form's numbered boxes. |
| `cms-1500-filled.png`        | The filled form rendered at 200 DPI — what the extractor sees.                                    |
| `cms-1500-filled.pdf`        | Same content as the PNG, in PDF form.                                                             |

Both rendered documents have a thin gray banner at the bottom reading **"SYNTHETIC SAMPLE -- ALL DATA IS FICTIONAL"** to make it unambiguous that this is synthetic test data, without obscuring any form fields.

## The synthetic claim

A coherent, plausible scenario suitable for extraction testing:

- **Patient:** Margaret L. Chen, DOB 06/14/1978, 4827 Maple Ridge Dr, Beaverton OR 97005
- **Primary insurance:** Blue Sky Health PPO 4000, group GRP-558220-A (patient is the insured)
- **Secondary insurance:** Aetna Open Access PPO via spouse David R. Chen (policy AET-W3387204-01)
- **Visit:** Office visit on 03/12/2026 at Westside Family Medicine for hypertension and hyperlipidemia follow-up
- **Diagnoses (ICD-10):** I10 (essential hypertension), E78.5 (hyperlipidemia), Z00.00 (general medical exam)
- **Services (CPT):**
  - 99214 — Office visit, established patient (30–39 min) — $185.00
  - 93000 — Routine ECG with at least 12 leads — $45.00
  - 36415 — Venipuncture for blood collection — $18.00
- **Totals:** $248.00 total charge, $25.00 copay collected, $223.00 balance to insurer
- **Provider:** Westside Family Medicine, EIN 93-1847562, NPI 1700203945, (503) 555-0298

All names, addresses, IDs, NPIs, EINs, and account numbers are fictional. ICD-10 and CPT codes are real and used here in a clinically plausible combination. Phone numbers use the **555 prefix** (the standard reserved-for-fiction range for North American phone numbers).

## A note on the source document

The CMS-1500 in production billing is **almost always typed or computer-printed**, not handwritten. The two largest Medicare Administrative Contractors (Noridian, NGS) explicitly discourage or reject handwritten paper claims because of OCR failures. ASCA further mandates electronic submission for most providers.

This sample reflects that reality: it shows the form as a small practice's EHR or billing software would print it onto the red OCR-drop-out paper template. It's representative of:

- Paper claims from providers who qualify for an ASCA waiver (small/low-volume billers)
- Patient-submitted out-of-network reimbursement requests
- Document-management workflows where typed CMS-1500s are scanned in batches and need to be parsed into structured data

For genuinely *handwritten* US healthcare-form data, patient intake forms and superbills are a closer fit; the CMS-1500 itself is almost always machine-printed.

## Schema features worth testing the extractor on

- **Conditional logic:** Box 9 (other insured) is only visible/required when Box 11d = "Yes". When Box 6 relationship = "Self", Boxes 4, 7, and 11a auto-mirror the patient data.
- **Dynamic rows:** Box 21 (diagnoses A–L) and Box 24 (service lines) are `matrixdynamic` — the extractor must determine row count from the source document and emit an array.
- **Input masks:** Phone numbers, ZIPs, NPIs, EINs, SSNs, dates, currency, CPT/HCPCS, and modifiers are all mask-protected text fields. Extracted values should match the visible formatting.
- **Numeric formats:** Currency stores as decimal (`185.00` not `"185 00"`). The paper form shows dollars and cents in two adjacent cells; the extractor should reassemble these.
- **Radio/checkbox encoding:** Yes/No fields encode as `"Y"`/`"N"`, sex as `"M"`/`"F"`, relationship as `"self"`/`"spouse"`/`"child"`/`"other"`, insurance type as a slug like `"group"`.
