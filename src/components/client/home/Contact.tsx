"use client";

import Image from "next/image";
import { FaEnvelope, FaMobile, FaGithub, FaLinkedin } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ContactForm from "./elements/ContactForm";

const Contact = () => {
  const { t } = useTranslation();

  return (
    <section className="p-5 sm:p-7 w-full h-full flex flex-col gap-10 md:gap-15 xl:gap-28 justify-center items-center relative my-7 md:my-20 overflow-x-hidden">
      <motion.div
        className="flex flex-col lg:flex-row gap-10 lg:gap-16 w-full max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex-initial lg:w-3/5 flex justify-center min-w-0 w-full">
          <ContactForm />
        </div>
        <div className="flex-1 lg:w-2/5 relative min-w-0 w-full flex justify-center lg:justify-start">
          <motion.div
            className="bg-base-100 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 flex flex-col gap-6 w-full max-w-md border border-base-300 min-w-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">
                {t("contactPage.readyTitle")}
              </h3>
              <p className="text-base-content/80 mb-1">
                {t("contactPage.contactPrompt")}
              </p>
              <p className="text-base-content/70 text-sm">
                {t("contactPage.ambitionMessage")}
              </p>
            </div>

            <div className="divider my-2"></div>

            <div className="flex flex-col gap-4">
              <a
                href="tel:+4522771246"
                className="flex items-center gap-3 text-accent hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaMobile size={18} className="text-primary" />
                </div>
                <span className="font-semibold">
                  {t("contactPage.phoneNumber")}
                </span>
              </a>
              <a
                href={`mailto:${t("contactPage.emailAddress")}`}
                className="flex items-center gap-3 text-accent hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaEnvelope size={18} className="text-primary" />
                </div>
                <span className="font-semibold">
                  {t("contactPage.emailAddress")}
                </span>
              </a>
            </div>

            <div className="divider my-2"></div>

            <div className="flex justify-start">
              <a
                href="https://www.linkedin.com/in/marcmoller/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                aria-label="LinkedIn"
              >
                Skriv direkte på LinkedIn
                <FaLinkedin size={22} className="text-base-content" />
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Contact;
