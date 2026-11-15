import { NextRequest, NextResponse } from "next/server";

type IdentifiedProduct = {
  name: string;
  quantity: number;
  grams: string;
  form: string;
  activeIngredients: string[];
  category: string;
  instructions: string;
};

const MAX_IMAGE_BASE64_LENGTH = 12_000_000;
const MAX_MANUAL_TEXT_LENGTH = 10_000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Prescription analysis is not configured." }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const input = body as { image?: unknown; mimeType?: unknown; manualText?: unknown };
  const image = typeof input.image === "string" ? input.image : "";
  const mimeType = typeof input.mimeType === "string" ? input.mimeType : "image/jpeg";
  const manualText = typeof input.manualText === "string" ? input.manualText.trim() : "";

  if (image.length > MAX_IMAGE_BASE64_LENGTH || manualText.length > MAX_MANUAL_TEXT_LENGTH) {
    return NextResponse.json({ error: "The image or prescription text exceeds the allowed size." }, { status: 413 });
  }
  if (!image && !manualText) {
    return NextResponse.json({ error: "Choose an image or enter a prescription list." }, { status: 400 });
  }
  if (image && !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mimeType)) {
    return NextResponse.json({ error: "The selected image format is not supported." }, { status: 415 });
  }

  const prompt = [
    `Analyze this ${image ? "medical prescription or list of products (image)" : "list of products or prescription (text)"}.`,
    manualText ? `USER TEXT: ${JSON.stringify(manualText)}` : "",
    "Extract the requested items. Return only a JSON object with a products array.",
    "Each item must contain name, quantity, grams, form, activeIngredients, category, and instructions.",
    "Use a positive integer quantity, an array of ingredient names, and empty strings or an empty array when details are not identifiable.",
    "Specify dosage form when identifiable (tablet, syrup, capsule, injection, suspension, gel, cream, or ointment)."
  ].filter(Boolean).join("\n");
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (image) {
    parts.push({ inline_data: { mime_type: mimeType, data: image } });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      console.error("Prescription analysis provider returned an error", response.status);
      return NextResponse.json({ error: "Unable to analyze the prescription right now." }, { status: 502 });
    }

    const result = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();
    if (!generatedText) {
      return NextResponse.json({ error: "The analysis service returned no product details." }, { status: 502 });
    }

    const parsed: unknown = JSON.parse(generatedText);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { products?: unknown }).products)) {
      return NextResponse.json({ error: "The analysis service returned an invalid product list." }, { status: 502 });
    }

    const products: IdentifiedProduct[] = (parsed as { products: unknown[] }).products
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map(item => ({
        name: typeof item.name === "string" ? item.name.trim() : "",
        quantity: Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        grams: typeof item.grams === "string" ? item.grams.trim() : "",
        form: typeof item.form === "string" ? item.form.trim() : "",
        activeIngredients: Array.isArray(item.activeIngredients)
          ? item.activeIngredients.filter((ingredient): ingredient is string => typeof ingredient === "string").map(ingredient => ingredient.trim()).filter(Boolean)
          : [],
        category: typeof item.category === "string" ? item.category.trim() : "General",
        instructions: typeof item.instructions === "string" ? item.instructions.trim() : "",
      }))
      .filter(item => item.name.length > 0);

    if (products.length === 0) {
      return NextResponse.json({ error: "No products were identified." }, { status: 422 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Prescription analysis failed", error);
    return NextResponse.json({ error: "Unable to analyze the prescription right now." }, { status: 502 });
  }
}
