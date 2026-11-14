/**
 * NUCC Health Care Provider Taxonomy codes for the providers a cytology /
 * histology lab can have as CUSTOMERS — clinicians whose practice generates
 * cytology or histology specimens that get sent out for sign-out.
 *
 * Deliberately NOT a list of every physician. Specialties that neither cut
 * tissue nor collect cells (anesthesiology, psychiatry, PM&R, emergency
 * medicine, preventive medicine, radiation oncology, pain, hospice, sports and
 * sleep medicine, …) are excluded, as are pathologists and lab staff
 * themselves — they are peers and competitors, not customers.
 *
 * Source: NUCC Health Care Provider Taxonomy, Version 26.1, July 2026.
 * https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40/csv-mainmenu-57
 *
 * A row only counts as a match if one of its taxonomy codes appears here.
 */
export const physicianCustomerCodeNames: Record<string, string> = {
  // Primary care & general practice — skin shaves, Paps, incidental biopsies
  "207Q00000X": "Family Medicine Physician",
  "207QA0000X": "Adolescent Medicine (Family Medicine) Physician",
  "207QA0505X": "Adult Medicine Physician",
  "207QG0300X": "Geriatric Medicine (Family Medicine) Physician",
  "207R00000X": "Internal Medicine Physician",
  "207RA0000X": "Adolescent Medicine (Internal Medicine) Physician",
  "207RG0300X": "Geriatric Medicine (Internal Medicine) Physician",
  "208D00000X": "General Practice Physician",
  "208M00000X": "Hospitalist Physician",
  "208000000X": "Pediatrics Physician",
  "2080A0000X": "Pediatric Adolescent Medicine Physician",

  // Dermatology — highest histology volume per provider
  "207N00000X": "Dermatology Physician",
  "207ND0101X": "MOHS-Micrographic Surgery Physician",
  "207NI0002X": "Clinical & Laboratory Dermatological Immunology Physician",
  "207NP0225X": "Pediatric Dermatology Physician",
  "207NS0135X": "Procedural Dermatology Physician",

  // Gastroenterology & hepatology — endoscopic biopsies, brushings, liver cores
  "207RG0100X": "Gastroenterology Physician",
  "207RI0008X": "Hepatology Physician",
  "207RT0003X": "Transplant Hepatology Physician",
  "2080P0206X": "Pediatric Gastroenterology Physician",
  "2080T0004X": "Pediatric Transplant Hepatology Physician",

  // Obstetrics & gynecology — cervical cytology, endometrial, LEEP, placenta
  "207V00000X": "Obstetrics & Gynecology Physician",
  "207VC0300X": "Complex Family Planning Physician",
  "207VE0102X": "Reproductive Endocrinology Physician",
  "207VF0040X":
    "Urogynecology and Reconstructive Pelvic Surgery (Obstetrics & Gynecology) Physician",
  "207VG0400X": "Gynecology Physician",
  "207VM0101X": "Maternal & Fetal Medicine Physician",
  "207VX0000X": "Obstetrics Physician",
  "207VX0201X": "Gynecologic Oncology Physician",

  // Urology — urine cytology, prostate cores, bladder biopsies
  "208800000X": "Urology Physician",
  "2088F0040X":
    "Urogynecology and Reconstructive Pelvic Surgery (Urology) Physician",
  "2088P0231X": "Pediatric Urology Physician",

  // Endocrinology — thyroid FNA
  "207RE0101X": "Endocrinology, Diabetes & Metabolism Physician",
  "2080P0205X": "Pediatric Endocrinology Physician",

  // Pulmonology — BAL, bronchial brushings, EBUS-FNA, pleural fluid
  "207RP1001X": "Pulmonary Disease Physician",
  "2080P0214X": "Pediatric Pulmonology Physician",

  // Otolaryngology — head & neck FNA, mucosal and laryngeal biopsies
  "207Y00000X": "Otolaryngology Physician",
  "207YP0228X": "Pediatric Otolaryngology Physician",
  "207YS0123X": "Facial Plastic Surgery Physician",
  "207YX0007X":
    "Plastic Surgery within the Head & Neck (Otolaryngology) Physician",
  "207YX0602X": "Otolaryngic Allergy Physician",
  "207YX0901X": "Otology & Neurotology Physician",
  "207YX0905X": "Otolaryngology/Facial Plastic Surgery Physician",

  // Hematology & oncology — marrow, lymph node, malignant effusions
  "207RH0000X": "Hematology (Internal Medicine) Physician",
  "207RH0003X": "Hematology & Oncology Physician",
  "207RX0202X": "Medical Oncology Physician",
  "2080P0207X": "Pediatric Hematology & Oncology Physician",

  // General & subspecialty surgery — resection specimens
  "204E00000X": "Oral & Maxillofacial Surgery (D.M.D.)",
  "204F00000X": "Transplant Surgery Physician",
  "208600000X": "Surgery Physician",
  "2086S0105X": "Surgery of the Hand (Surgery) Physician",
  "2086S0120X": "Pediatric Surgery Physician",
  "2086S0122X": "Plastic and Reconstructive Surgery Physician",
  "2086S0127X": "Trauma Surgery Physician",
  "2086S0129X": "Vascular Surgery Physician",
  "2086X0206X": "Surgical Oncology Physician",
  "208C00000X": "Colon & Rectal Surgery Physician",
  "208G00000X": "Thoracic Surgery (Cardiothoracic Vascular Surgery) Physician",

  // Neurosurgery & neuromuscular medicine — CNS, muscle and nerve biopsies
  "207T00000X": "Neurological Surgery Physician",
  "2084N0008X": "Neuromuscular Medicine (Psychiatry & Neurology) Physician",

  // Orthopaedics — bone, soft tissue and synovial specimens
  "207X00000X": "Orthopaedic Surgery Physician",
  "207XP3100X": "Pediatric Orthopaedic Surgery Physician",
  "207XS0106X": "Orthopaedic Hand Surgery Physician",
  "207XS0114X": "Adult Reconstructive Orthopaedic Surgery Physician",
  "207XS0117X": "Orthopaedic Surgery of the Spine Physician",
  "207XX0004X": "Orthopaedic Foot and Ankle Surgery Physician",
  "207XX0801X": "Orthopaedic Trauma Physician",

  // Plastic surgery — skin and soft tissue excisions
  "208200000X": "Plastic Surgery Physician",
  "2082S0099X":
    "Plastic Surgery Within the Head and Neck (Plastic Surgery) Physician",
  "2082S0105X": "Surgery of the Hand (Plastic Surgery) Physician",

  // Ophthalmology — corneal, conjunctival, eyelid and vitreous specimens
  "207W00000X": "Ophthalmology Physician",
  "207WX0107X": "Retina Specialist (Ophthalmology) Physician",
  "207WX0108X":
    "Uveitis and Ocular Inflammatory Disease (Ophthalmology) Physician",
  "207WX0120X": "Cornea and External Diseases Specialist Physician",
  "207WX0200X": "Ophthalmic Plastic and Reconstructive Surgery Physician",

  // Nephrology — renal core biopsies
  "207RN0300X": "Nephrology Physician",
  "2080P0210X": "Pediatric Nephrology Physician",

  // Rheumatology — synovial fluid, labial gland and temporal artery biopsies
  "207RR0500X": "Rheumatology Physician",
  "2080P0216X": "Pediatric Rheumatology Physician",

  // Infectious disease — tissue for special stains and culture
  "207RI0200X": "Infectious Disease Physician",
  "2080P0208X": "Pediatric Infectious Diseases Physician",

  // Cardiology — endomyocardial biopsy (transplant/heart failure only)
  "207RA0001X": "Advanced Heart Failure and Transplant Cardiology Physician",

  // Radiology — image-guided FNA and core biopsies
  "2085B0100X": "Body Imaging Physician",
  "2085N0700X": "Neuroradiology Physician",
  "2085P0229X": "Pediatric Radiology Physician",
  "2085R0202X": "Diagnostic Radiology Physician",
  "2085R0204X": "Vascular & Interventional Radiology Physician",
  "2085U0001X": "Diagnostic Ultrasound Physician",
};

/**
 * Non-physician customers. They are not MD/DO, but they carry their own NPI,
 * sign their own requisitions, and account for a large share of skin biopsy,
 * nail, cervical cytology and oral specimen volume. Drop this map from the
 * spread below to restrict the extract to physicians only.
 */
export const nonPhysicianCustomerCodeNames: Record<string, string> = {
  // Physician assistants
  "363A00000X": "Physician Assistant",
  "363AM0700X": "Medical Physician Assistant",
  "363AS0400X": "Surgical Physician Assistant",

  // Nurse practitioners — dermatology, primary care and women's health
  "363L00000X": "Nurse Practitioner",
  "363LA2200X": "Adult Health Nurse Practitioner",
  "363LF0000X": "Family Nurse Practitioner",
  "363LG0600X": "Gerontology Nurse Practitioner",
  "363LW0102X": "Women's Health Nurse Practitioner",

  // Podiatrists — nail and skin biopsies
  "213E00000X": "Podiatrist",
  "213EG0000X": "Podiatrist",
  "213EP1101X": "Primary Podiatric Medicine Podiatrist",
  "213ES0103X": "Foot & Ankle Surgery Podiatrist",
  "213ES0131X": "Foot Surgery Podiatrist",

  // Oral & maxillofacial surgery (dental) — oral mucosal specimens
  "1223S0112X": "Oral and Maxillofacial Surgery (Dentist)",
};

export const taxonomyCodeNames: Record<string, string> = {
  ...physicianCustomerCodeNames,
  ...nonPhysicianCustomerCodeNames,
};

export const taxonomyCodes: string[] = Object.keys(taxonomyCodeNames);
