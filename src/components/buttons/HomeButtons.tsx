import { Links } from "@/types/links.type";
import Image from "next/image";
import Link from "next/link";
import { useUserAccess } from "@/hooks/auth/useUserAccess";

interface RedirectButtonsProps {
  data: Links[];
}

const HomeButtons = ({ data }: RedirectButtonsProps) => {
  const { canAccessPath } = useUserAccess();
  const allowedLinks = data.filter((link) => canAccessPath(link.href));

  return (
    <section className="relative z-20 grid w-full grid-cols-4 gap-1 mt-2">
      {allowedLinks.map((link: Links) => (
        <Link
          key={link.id}
          href={link.href}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-white p-2 shadow-xl active:scale-95 transition-all duration-300"
        >
          <div className="flex items-center justify-center w-full">
            {link.icon ? (
              typeof link.icon === "string" ? (
                <span className="text-2xl">{link.icon}</span>
              ) : (
                <link.icon className="h-8 w-8 text-primary" />
              )
            ) : link.iconSrc ? (
              <Image
                src={link.iconSrc}
                alt={link.name}
                className={link.className}
              />
            ) : null}
          </div>
          <span
            className={`${link.fontSize} font-bold uppercase text-primary text-center`}
          >
            {link.name}
          </span>
        </Link>
      ))}
    </section>
  );
};

export default HomeButtons;
