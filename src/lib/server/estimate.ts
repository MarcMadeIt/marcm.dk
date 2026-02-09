import { createServerClientInstance } from "@/utils/supabase/server";

type FeaturePricing = {
  labelEn: string;
  labelDa: string;
  priceEur: number;
  priceDkk: number;
};

const FEATURE_PRICING: FeaturePricing[] = [
  {
    labelEn: "Newsletter",
    labelDa: "Nyhedsbrev",
    priceEur: 135,
    priceDkk: 995,
  },
  {
    labelEn: "Payment solution",
    labelDa: "Betalingsløsning",
    priceEur: 265,
    priceDkk: 1995,
  },
  {
    labelEn: "Webshop funktionality",
    labelDa: "Webhop funktionalitet",
    priceEur: 670,
    priceDkk: 4995,
  },
  {
    labelEn: "Booking system",
    labelDa: "Bookingsystem",
    priceEur: 535,
    priceDkk: 3995,
  },
  {
    labelEn: "AI Integration",
    labelDa: "AI-integration",
    priceEur: 535,
    priceDkk: 3995,
  },
  {
    labelEn: "Photo package",
    labelDa: "Foto-pakke",
    priceEur: 265,
    priceDkk: 1995,
  },
  {
    labelEn: "Presentation video",
    labelDa: "Præsentationsvideo",
    priceEur: 395,
    priceDkk: 2995,
  },
];

const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

type FeatureItem = {
  label: string;
  price?: string;
};

export type EstimateResult = {
  estimate: string;
  monthlyInstallment?: string;
  serviceFee?: string;
  basePackage?: string;
  features: FeatureItem[];
};

export async function calculateEstimateFromAnswers(
  answers: number[][],
  packageOptionIdFromCaller?: number,
  lang: "en" | "da" = "en"
): Promise<EstimateResult> {
  const supabase = await createServerClientInstance();
  // allow caller (route) to explicitly pass the package-option id
  const packageOptionId = packageOptionIdFromCaller ?? answers[1]?.[0];
  if (!packageOptionId) {
    throw new Error("No package selected");
  }

  const { data: optRow, error: optErr } = await supabase
    .from("options")
    .select("package_id, text")
    .eq("id", packageOptionId)
    .maybeSingle();
  if (optErr) {
    throw new Error("Failed to load package mapping: " + optErr.message);
  }
  if (!optRow) {
    throw new Error(`No option found with id="${packageOptionId}"`);
  }

  if (!optRow.package_id) {
    throw new Error(
      `Option ${packageOptionId} ("${
        optRow.text ?? "unknown"
      }") has no linked package`
    );
  }
  const packageId = optRow.package_id;

  const { data: pkg, error: pkgErr } = await supabase
    .from("packages")
    .select("price_eur, price_dkk, month_eur, month_dkk, fee_eur, fee_dkk")
    .eq("id", packageId)
    .maybeSingle();
  if (pkgErr) {
    throw new Error("DB error loading package price: " + pkgErr.message);
  }
  if (!pkg) {
    throw new Error(`No package found with id="${packageId}"`);
  }
  const isDanish = lang === "da";
  const basePackageValue = Number(isDanish ? pkg.price_dkk : pkg.price_eur);
  let price = basePackageValue;

  const otherOptionIds = answers
    .flat()
    .filter((id): id is number => id !== packageOptionId);

  const features: FeatureItem[] = [];

  if (otherOptionIds.length) {
    const { data: opts, error: optsErr } = await supabase
      .from("options")
      .select("kind, text, text_translated")
      .in("id", otherOptionIds);
    if (optsErr) {
      throw new Error("Failed to load options: " + optsErr.message);
    }

    for (const o of opts) {
      if (o.kind !== "addon") continue;
      const labelRaw =
        isDanish && o.text_translated ? o.text_translated : o.text;
      if (!labelRaw) continue;
      const normalizedLabel = normalizeLabel(labelRaw);
      const matched = FEATURE_PRICING.find(
        (item) =>
          normalizeLabel(item.labelEn) === normalizedLabel ||
          normalizeLabel(item.labelDa) === normalizedLabel
      );
      const featureValue = matched
        ? isDanish
          ? matched.priceDkk
          : matched.priceEur
        : undefined;
      if (featureValue != null) {
        price += featureValue;
      }
      features.push({
        label: labelRaw,
        price: featureValue != null ? String(featureValue) : undefined,
      });
    }
  }

  const formatter = new Intl.NumberFormat(isDanish ? "da-DK" : "de-DE", {
    style: "currency",
    currency: isDanish ? "DKK" : "EUR",
    maximumFractionDigits: 0,
  });

  const monthlyInstallmentValue = isDanish ? pkg.month_dkk : pkg.month_eur;
  const serviceFeeValue = isDanish ? pkg.fee_dkk : pkg.fee_eur;

  return {
    estimate: formatter.format(Math.round(price)),
    monthlyInstallment:
      monthlyInstallmentValue !== null && monthlyInstallmentValue !== undefined
        ? formatter.format(Math.round(Number(monthlyInstallmentValue)))
        : undefined,
    serviceFee:
      serviceFeeValue !== null && serviceFeeValue !== undefined
        ? formatter.format(Math.round(Number(serviceFeeValue)))
        : undefined,
    basePackage: formatter.format(Math.round(basePackageValue)),
    features: features.map((feature) => ({
      label: feature.label,
      price:
        feature.price != null
          ? formatter.format(Math.round(Number(feature.price)))
          : undefined,
    })),
  };
}
