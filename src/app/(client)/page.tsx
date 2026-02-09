import { Metadata } from "next";
import HomePage from "./HomePage";

export const metadata: Metadata = {
  title: {
    absolute: "Marc Møller - Software Engineer",
  },
  description:
    "Software Engineer focused on high-performance web applications, clean UI, and scalable architecture",
};

export default function Page() {
  return (
    <>
      <p className="sr-only">
        Software Engineer focused on high-performance web applications, clean
        UI, and scalable architecture
      </p>
      <HomePage />
    </>
  );
}
