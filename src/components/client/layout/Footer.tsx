import Link from "next/link";
import { SiDailydotdev } from "react-icons/si";
import { SiLinkedin } from "react-icons/si";
import { SiGithub } from "react-icons/si";
import { useTranslation } from "react-i18next";
import { FaGithub, FaHashtag, FaRegCopyright } from "react-icons/fa6";
import Image from "next/image";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto">
      {/* <footer className="footer sm:footer-horizontal bg-base-100 text-base-content p-3 md:p-5 py-5 md:py-10  border-base-300 border-t rounded-2xl">
        <nav className="flex flex-row">
          <Link href="/#projects" className="link link-hover">
            {t("Header.projects")}
          </Link>
          <Link href="/#blog" className="link link-hover">
            {t("Header.blog")}
          </Link>
          <Link href="/#contact" className="link link-hover">
            {t("Header.contact")}
          </Link>
        </nav>
      </footer> */}
      <footer className="footer bg-base-100 flex flex-row justify-between items-center text-base-content p-5 py-5 md:py-10">
        <aside className="flex flex-col gap-4">
          <Link
            href="/"
            className="btn btn-ghost md:text-2xl text-xl font-bold flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Marc Møller"
              width={100}
              height={100}
              className="w-8 h-auto"
            />
            Marc Møller
          </Link>
          <span className="ml-2 text-[10px] sm:text-xs text-zinc-500 flex  items-center gap-[5px]">
            <FaRegCopyright /> {new Date().getFullYear()} marcm.dk -{" "}
            {t("AllRightReserved")}
          </span>
        </aside>
        <div className="grid grid-flow-col gap-4 md:gap-6 text-3xl items-center justify-end">
          <Link
            href="https://app.daily.dev/marcmadeit"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hover:text-secondary md:transition-colors md:duration-300"
            aria-label={t("aria.footer.linkToFacebook", "Go to Facebook")}
          >
            <SiDailydotdev size={38} />
          </Link>
          <Link
            href="https://github.com/marcmadeit"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hover:text-secondary md:transition-colors md:duration-300"
            aria-label={t("aria.footer.linkToGithub", "Go to Github")}
          >
            <SiGithub size={33} />
          </Link>
          <Link
            href="https://www.linkedin.com/in/marcmoller/"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hover:text-secondary md:transition-colors md:duration-300"
            aria-label={t("aria.footer.linkToLinkedIn", "Go to LinkedIn")}
          >
            <SiLinkedin size={30} />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
