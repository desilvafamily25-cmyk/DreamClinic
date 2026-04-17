# DreamClinic Document Folder System — How To Use

## File Naming Convention

Every file saved into this system must follow this format:

```
YYYY-MM-DD_DocumentType_Party_ShortDescription_v1
```

### Examples

| What you're saving | File name |
|---|---|
| GP contractor agreement with Dr Smith, signed today | 2026-04-18_Contract_DrSmith_GPContractorAgreement_v1 |
| Public liability insurance certificate of currency | 2026-05-01_Insurance_BrokerName_PublicLiabilityCofC_v1 |
| Monthly payroll summary for June 2026 | 2026-06-30_Payroll_DreamClinic_MonthlySummaryJun2026_v1 |
| Lease agreement from the seller | 2026-04-18_Lease_LandlordName_ClinicLeaseAgreement_v1 |
| BAS lodgement for Q1 2026 | 2026-04-28_BAS_ATO_QuarterlyLodgementQ1-2026_v1 |
| Updated version of a document | 2026-08-01_Contract_DrSmith_GPContractorAgreement_v2 |

### Rules
- Always use the date the document was **signed or issued** (not today's date if different)
- Use underscores, never spaces
- Keep the short description under 5 words
- Increment the version number (v1, v2, v3) when you replace a document with an updated version — **keep the old version, never delete it**
- Use plain English, no abbreviations that only you understand

---

## Where Does Each Document Go?

| Document | Folder |
|---|---|
| GP employment or contractor agreement | 05_GP_Doctors → 05_a or 05_b |
| GP's AHPRA certificate | 05_GP_Doctors → 05_d |
| Nurse's employment contract | 06_Nursing_Staff → 06_a |
| Reception staff contract | 07_Reception_Staff → 07_a |
| Insurance policy or certificate | 10_Insurance_and_Risk → relevant subfolder |
| Lease agreement | 11_Lease_and_Building → 11_a |
| BAS, tax returns, payroll summaries | 03_Tax_and_ATO → relevant subfolder |
| PRODA / Medicare / PIP documents | 08_Medicare_and_Digital_Health |
| RACGP accreditation certificate | 09_Accreditation_and_Clinical_Policies → 09_b |
| Anything from the acquisition process | 16_Acquisition_and_Due_Diligence |
| Old/expired documents | 17_Archive → relevant subfolder |

---

## How This Connects to Notion

The Notion **Contracts Register** and **Compliance Register** databases act as the **index** for this folder system.

When you save a document here, go into Notion and add or update the matching row:
- Paste the file name into the "File Name" field
- Add the folder path (e.g., `05_GP_Doctors/05_a_Principal_and_Employed_GP_Contracts`)
- Set the expiry date so it appears in the Renewal & Expiry Tracker

This way you can search Notion to find any document instantly, then go straight to the correct subfolder to open it.

---

## Retention Rules (Victorian GP Clinic)

| Document type | Minimum retention |
|---|---|
| Patient medical records (adults) | 7 years from last entry |
| Patient medical records (children) | Until age 25 |
| Staff employment records | 7 years after employment ends |
| Financial records (tax/BAS) | 5 years |
| Workplace injury records | 30 years (WorkSafe Vic) |
| Contracts | 7 years after expiry |

**When in doubt, keep it.** Storage is cheap; re-creating a missing document during a Medicare audit or legal dispute is not.

---

*Source: DreamClinic GP Operator's Framework — Part 11 & 12. Expert knowledge, external verification recommended.*
