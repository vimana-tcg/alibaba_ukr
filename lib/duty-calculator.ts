// EU-Ukraine DCFTA chapters with 0% duty
const EU_DCFTA_ZERO_CHAPTERS = new Set([
  '01','02','03','04','05','06','07','08','09','10','11','12',
  '13','14','15','16','17','18','19','20','21','22','23','24',
  '25','26','27','28','29','30','31','32','33','34','35','36',
  '37','38','39','40','41','42','43','44','45','46','47','48',
  '49','50','51','52','53','54','55','56','57','58','59','60',
  '61','62','63','64','65','66','67','68','69','70','71','72',
  '73','74','75','76','78','79','80','81','82','83','84','85',
  '86','87','88','89','90','91','92','93','94','95','96','97',
]);

// EU MFN fallback rates by HS chapter
const EU_MFN_RATES: Record<string, number> = {
  '01': 5.1, '02': 12.8, '03': 9.6, '04': 36.4, '07': 8.8,
  '08': 8.0, '10': 20.9, '11': 28.7, '15': 5.1, '16': 17.1,
  '17': 22.5, '18': 8.3, '19': 9.7, '20': 14.7, '22': 5.3,
  '24': 22.5, '61': 12.0, '62': 12.0, '64': 8.5, '72': 0,
  '84': 0,   '85': 0,   '87': 6.5,  '90': 0,
};

// EU VAT by country
const EU_VAT: Record<string, number> = {
  DE: 19, FR: 20, IT: 22, NL: 21, PL: 23, BE: 21,
  SE: 25, AT: 20, ES: 21, CZ: 21, RO: 19, HU: 27,
};

const EU_COUNTRIES = new Set([
  'DE','FR','IT','NL','PL','BE','SE','AT','ES','CZ',
  'RO','HU','SK','BG','HR','DK','FI','GR','IE','LT',
  'LV','EE','SI','PT','LU','MT','CY',
]);

export interface DutyResult {
  hs_code: string;
  hs_description: string;
  product_value: number;
  freight_cost: number;
  insurance_cost: number;
  cif_value: number;
  trade_agreement: string;
  duty_rate_pct: number;
  duty_amount: number;
  vat_rate_pct: number;
  vat_amount: number;
  total_landed_cost: number;
  dcfta_saving: number;
  requires_eur1: boolean;
  notes: string[];
}

export function calculateDuty(params: {
  hsCode: string;
  hsDescription: string;
  origin: string;
  destination: string;
  value: number;
  freight: number;
  insurance: number;
}): DutyResult {
  const { hsCode, hsDescription, origin, destination, value, freight, insurance } = params;

  const cifValue = value + freight + insurance;
  const chapter = hsCode.slice(0, 2);

  // Determine agreement & duty rate
  let tradeAgreement = 'WTO-MFN';
  let dutyRatePct = EU_MFN_RATES[chapter] ?? 3.5;
  let requiresEur1 = false;
  const notes: string[] = [];

  if (origin === 'UA' && EU_COUNTRIES.has(destination)) {
    tradeAgreement = 'EU-DCFTA';
    if (EU_DCFTA_ZERO_CHAPTERS.has(chapter)) {
      dutyRatePct = 0;
      requiresEur1 = true;
      notes.push('EUR.1 Movement Certificate required to claim 0% DCFTA duty rate.');
    } else {
      dutyRatePct = EU_MFN_RATES[chapter] ?? 3.5;
    }
  } else if (origin === 'UA' && destination === 'GB') {
    tradeAgreement = 'UK-UKRAINE-FTA';
    dutyRatePct = 0;
    requiresEur1 = true;
    notes.push('UK-Ukraine Free Trade Agreement: 0% duty with proof of origin.');
  }

  const dutyAmount = (cifValue * dutyRatePct) / 100;
  const vatRatePct = EU_VAT[destination] ?? 20;
  const vatBase = cifValue + dutyAmount;
  const vatAmount = (vatBase * vatRatePct) / 100;
  const totalLandedCost = cifValue + dutyAmount + vatAmount;

  // DCFTA saving vs MFN
  const mfnRate = EU_MFN_RATES[chapter] ?? 3.5;
  const mfnDuty = (cifValue * mfnRate) / 100;
  const dcftaSaving =
    tradeAgreement === 'EU-DCFTA' && dutyRatePct === 0
      ? mfnDuty
      : 0;

  if (dcftaSaving > 0) {
    notes.push(`You save $${dcftaSaving.toFixed(0)} compared to MFN rate (${mfnRate}%) thanks to EU-Ukraine DCFTA.`);
  }

  return {
    hs_code: hsCode,
    hs_description: hsDescription,
    product_value: value,
    freight_cost: freight,
    insurance_cost: insurance,
    cif_value: cifValue,
    trade_agreement: tradeAgreement,
    duty_rate_pct: dutyRatePct,
    duty_amount: dutyAmount,
    vat_rate_pct: vatRatePct,
    vat_amount: vatAmount,
    total_landed_cost: totalLandedCost,
    dcfta_saving: dcftaSaving,
    requires_eur1: requiresEur1,
    notes,
  };
}
