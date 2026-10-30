"use client";
import { ArrowLeftCircleIcon, HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoSiga from "@/assets/icons/SIGA CATTLE ICON.png";

import { getDeviceHomeRoute } from "@/hooks/use-mobile";

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full p-4 bg-primary text-white flex flex-col items-center gap-5">
      <div className="flex items-center justify-center">
        <Image src={logoSiga} alt="Logo" width={48} height={48} />
      </div>
      <nav className="flex items-center justify-between w-full py-2">
        <ArrowLeftCircleIcon
          size={30}
          className="cursor-pointer"
          onClick={() => router.back()}
        />
        <h1 className="text-xl font-medium uppercase">{title}</h1>
        <HomeIcon
          onClick={() => router.push(getDeviceHomeRoute())}
          size={30}
          color="white"
        />
      </nav>
    </header>
  );
}

export default Header;
