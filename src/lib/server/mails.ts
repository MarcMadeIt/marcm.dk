import nodemailer from "nodemailer";
import { translateText, translateHtml } from "./deepl";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function sendContactEmail(
  company: string,
  email: string,
  message: string,
  lang: "en" | "da" = "en"
): Promise<void> {
  const adminText = `You’ve received a new message:
Company: ${company}
Email: ${email}

${message}`;

  const adminHtml = `
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 32px 24px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-family: Arial, sans-serif; color: #333;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <img src="https://arzonic.com/icon-512x512.png" alt="Arzonic Logo" width="40" style="display: block;" />
      <span style="font-size: 22px; padding-left: 5px; padding-top: 1px; font-weight: bold; color: #111;">Arzonic</span>
    </div>
    <p style="margin-bottom: 16px;">A new customer has submitted the contact form on <strong>arzonic.com</strong>.</p>
    <a href="https://arzonic.com/admin/messages" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 500;">
      View Customer Message
    </a>
    <p style="font-size: 12px; color: #888; margin-top: 32px;">This is an automated notification from Arzonic Agency.</p>
  </div>`;

  const userText = `Hi ${company},

Thanks for reaching out! We’ll be in touch shortly.

– Arzonic`;

  const userHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); color: #333; text-align: start;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <img src="https://arzonic.com/icon-512x512.png" alt="Arzonic Logo" width="40" style="display: block;" />
      <span style="font-size: 22px; padding-left: 5px; padding-top: 1px; font-weight: bold; color: #111;">Arzonic</span>
    </div>
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Thanks for your message, ${company}!</h2>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-size: 16px; font-weight: 500;">
        We’ve received your inquiry and will get back to you shortly.
      </p>
    </div>
    <p>If you're curious already, feel free to try our project estimator and get a quick price range for your next idea:</p>
    <div style="margin: 16px 0;">
      <a href="https://arzonic.com/get-started" style="background-color: #2563eb; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        Try our price estimator
      </a>
    </div>
    <p style="font-size: 14px; color: #555;">Have questions or want to add more details? Just reply to this email or <a href="mailto:mail@arzonic.com" style="color: #2563eb;">contact us directly</a>.</p>
    <p style="margin-top: 32px;">Best regards,<br/><strong>Arzonic Agency</strong></p>
  </div>`;

  let adminTextTr = adminText;
  let adminHtmlTr = adminHtml;
  let userTextTr = userText;
  let userHtmlTr = userHtml;

  if (lang !== "en") {
    [adminTextTr, userTextTr] = await Promise.all([
      translateText(adminText, lang),
      translateText(userText, lang),
    ]);

    [adminHtmlTr, userHtmlTr] = await Promise.all([
      translateHtml(adminHtml, lang),
      translateHtml(userHtml, lang),
    ]);
  }

  // Send to admin
  await transporter.sendMail({
    from: `"Website Contact" <${process.env.FROM_EMAIL!}>`,
    to: process.env.ADMIN_EMAIL!,
    subject:
      lang === "da"
        ? `Ny kontaktbesked fra ${company}`
        : `New contact form submission from ${company}`,
    text: adminTextTr,
    html: adminHtmlTr,
  });

  // Send to user
  await transporter.sendMail({
    from: `"Arzonic" <${process.env.FROM_EMAIL!}>`,
    to: email,
    subject:
      lang === "da"
        ? `Vi har modtaget din besked, ${company}`
        : `We’ve received your message, ${company}!`,
    text: userTextTr,
    html: userHtmlTr,
  });
}

/**
 * Sends estimate emails to admin and user, translating content via DeepL if needed.
 * @param name - recipient name
 * @param email - user email address
 * @param estimate - formatted estimate string
 * @param details - breakdown or summary details
 * @param packageLabel - human-readable package name
 * @param monthlyInstallment - formatted monthly installment price
 * @param serviceFee - formatted service agreement setup fee
 * @param basePackage - formatted base package price
 * @param features - formatted feature list
 * @param lang - target language code (e.g. 'en' or 'da')
 */

export async function sendEstimatorEmail(
  company: string,
  email: string,
  estimate: string,
  details: string,
  packageLabel: string,
  monthlyInstallment: string | undefined,
  serviceFee: string | undefined,
  basePackage: string | undefined,
  features: { label: string; price?: string }[],
  lang: "en" | "da" = "en"
): Promise<void> {
  const estimateLine =
    lang === "da"
      ? `Anslået Pakkepris: Engangspris ${estimate}${
          monthlyInstallment
            ? ` eller ${monthlyInstallment} pr. måned i 48 måneder`
            : ""
        }`
      : `Estimated Package price: One-time price ${estimate}${
          monthlyInstallment
            ? ` or ${monthlyInstallment} per month for 48 months`
            : ""
        }`;

  const serviceAgreementText = serviceFee
    ? lang === "da"
      ? `Serviceaftale (ikke inkluderet i pakkeprisen): ${serviceFee}`
      : `Service agreement (not included in package price): ${serviceFee}`
    : "";

  const featuresText =
    features.length > 0
      ? features
          .map((feature) =>
            feature.price ? `${feature.label}: ${feature.price}` : feature.label
          )
          .join("\n    ")
      : "";
  const adminText = `Estimate request details:
    Company: ${company}
    Email: ${email}
    Selected package: ${packageLabel}
    ${estimateLine}
    ${featuresText ? `Features:\n    ${featuresText}` : ""}
    ${serviceAgreementText}
    ${details}`;

  const adminHtml = `<h2>New Estimate Request</h2>
    <p><strong>Company:</strong> ${company}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>${
      lang === "da" ? "Anslået pris" : "Estimated price"
    }:</strong> ${estimateLine.replace(/^.*?:\s*/, "")}</p>
    ${
      features.length
        ? `<p><strong>Features:</strong><br/>${features
            .map((feature) =>
              feature.price
                ? `${feature.label}: ${feature.price}`
                : feature.label
            )
            .join("<br/>")}</p>`
        : ""
    }
    ${
      serviceFee
        ? `<p><strong>${
            lang === "da" ? "Serviceaftale" : "Service agreement"
          }:</strong> ${
            lang === "da"
              ? `${serviceFee} (ikke inkluderet i pakkeprisen)`
              : `${serviceFee} (not included in package price)`
          }</p>`
        : ""
    }
    <hr/>
       <p><strong>Selected package:</strong> ${packageLabel}</p>
    <p>${details.replace(/\n/g, "<br/>")}</p>`;

  const userText = `Hi ${company},

    Thanks for using our project estimator – we're excited to learn more about your vision!

    ${estimateLine}
    ${featuresText ? `Features:\n    ${featuresText}` : ""}
    ${serviceAgreementText}

    This is a non-binding, preliminary estimate based on the details you provided.
    We’ll be in touch shortly to discuss your project further.

    If you have any questions, ideas, or just want to chat, reply directly to this email.

    Best,
    The Arzonic Team`;

  const userHtml = `<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); color: #333333;">
    <p>Hi ${company},</p>
    <p>Thanks for using our project estimator – we’re excited to learn more about your vision!</p>
      <strong>${
        lang === "da" ? "Anslået pris" : "Estimated price"
      }:</strong> ${estimateLine.replace(/^.*?:\s*/, "")}</p>
    <p><strong>Selected package:</strong> ${packageLabel}</p>
    ${
      features.length
        ? `<p><strong>Features:</strong><br/>${features
            .map((feature) =>
              feature.price
                ? `${feature.label}: ${feature.price}`
                : feature.label
            )
            .join("<br/>")}</p>`
        : ""
    }
    ${
      serviceFee
        ? `<p><strong>${
            lang === "da" ? "Serviceaftale" : "Service agreement"
          }:</strong> ${
            lang === "da"
              ? `${serviceFee} (ikke inkluderet i prisen)`
              : `${serviceFee} (not included in price)`
          }</p>`
        : ""
    }
    <p style="font-size:12px; background:#f9f9f9; padding:8px; border-radius:4px;">Please note this is a <strong>non-binding estimate</strong> based on your input.</p>
    <p>We’ll carefully review your submission and get back to you — no matter what.</p>
    <p>If you have any additional information or questions, feel free to reply directly or <a href="mailto:mail@arzonic.com" style="color: #2563eb;">contact us</a>.</p>
    <p>Best regards,<br/><strong>The Arzonic Team</strong></p>
        <div style="text-align: start; margin-bottom: 24px;">
      <img src="https://arzonic.com/icon-512x512.png" alt="Arzonic Logo" width="80" style="display: block;" />
    </div>
    </div>`;

  let adminTextTr = adminText;
  let adminHtmlTr = adminHtml;
  let userTextTr = userText;
  let userHtmlTr = userHtml;

  if (lang !== "en") {
    [adminTextTr, userTextTr] = await Promise.all([
      translateText(adminText, lang),
      translateText(userText, lang),
    ]);
    [adminHtmlTr, userHtmlTr] = await Promise.all([
      translateHtml(adminHtml, lang),
      translateHtml(userHtml, lang),
    ]);
  }

  await transporter.sendMail({
    from: `"New Client Request - Price Estimator" <${process.env.FROM_EMAIL!}>`,
    to: process.env.ADMIN_EMAIL!,
    subject:
      lang === "da"
        ? `Ny tilbudsanmodning fra ${company}`
        : `New estimate request from ${company}`,
    text: adminTextTr,
    html: adminHtmlTr,
  });

  await transporter.sendMail({
    from: `"Arzonic" <${process.env.FROM_EMAIL!}>`,
    to: email,
    subject:
      lang === "da"
        ? `Dit forslag er klar, ${company}!`
        : `Your project estimate is ready, ${company}`,
    text: userTextTr,
    html: userHtmlTr,
  });
}

/**
 * Sends job application confirmation emails to admin and applicant.
 * @param company - applicant's company
 * @param mail - applicant's email address
 * @param title - title of the job applied for
 * @param lang - target language code (e.g., 'en' or 'da')
 */
export async function sendJobApplicationConfirmEmail(
  company: string,
  mail: string,
  title: string,
  lang: "en" | "da" = "en"
): Promise<void> {
  const adminText = `New job application received:
  Company: ${company}
  Email: ${mail}
  Job Title: ${title}
  `;

  const adminHtml = `
  <h2>New Job Application</h2>
  <p><strong>Company:</strong> ${company}</p>
  <p><strong>Mail:</strong> ${mail}</p>
  <p><strong>Job Post:</strong> ${title}</p>
  `;

  const userText = `Hi ${company},

  Thank you for applying for the ${title} position at Arzonic. We’ve received your application and will review it shortly.

  Best regards,
  The Arzonic Team`;

  const userHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); color: #333; text-align: start;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <img src="https://arzonic.com/icon-512x512.png" alt="Arzonic Logo" width="40" style="display: block;" />
      <span style="font-size: 22px; padding-left: 5px; padding-top: 1px; font-weight: bold; color: #111;">Arzonic</span>
    </div>
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Thanks for applying, ${company}!</h2>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-size: 16px;">
        We’ve received your application for the <strong>${title}</strong> position. We’ll get back to you — no matter what.
      </p>
    </div>
    <p style="font-size: 14px; color: #555;">Have questions or want to update your application? Just reply to this email or contact us at <a href="mailto:mail@arzonic.com" style="color: #2563eb;">mail@arzonic.com</a>.</p>
    <p style="margin-top: 32px;">Best regards,<br/><strong>The Arzonic Team</strong></p>
  </div>`;

  let adminTextTr = adminText;
  let adminHtmlTr = adminHtml;
  let userTextTr = userText;
  let userHtmlTr = userHtml;

  if (lang !== "en") {
    [adminTextTr, userTextTr] = await Promise.all([
      translateText(adminText, lang),
      translateText(userText, lang),
    ]);

    [adminHtmlTr, userHtmlTr] = await Promise.all([
      translateHtml(adminHtml, lang),
      translateHtml(userHtml, lang),
    ]);
  }

  // Send to admin
  await transporter.sendMail({
    from: `"Job Application" <${process.env.FROM_EMAIL!}>`,
    to: process.env.ADMIN_EMAIL!,
    subject:
      lang === "da"
        ? `Ny jobansøgning fra ${company}`
        : `New job application from ${company}`,
    text: adminTextTr,
    html: adminHtmlTr,
  });

  // Send to applicant
  await transporter.sendMail({
    from: `"Arzonic" <${process.env.FROM_EMAIL!}>`,
    to: mail,
    subject:
      lang === "da"
        ? `Tak for din ansøgning!`
        : `Thank you for your application!`,
    text: userTextTr,
    html: userHtmlTr,
  });
}
