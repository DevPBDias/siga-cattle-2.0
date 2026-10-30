"use client";
import { ArrowLeftCircleIcon, HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoSiga from "@/assets/icons/logo_hor_siga_cattle.png";

import { getDeviceHomeRoute } from "@/hooks/use-mobile";

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full p-4 bg-primary text-white flex flex-col items-center gap-5">
      <div className="flex items-center justify-center">
        <Image
          src={logoSiga}
          alt="SIGA Cattle"
          width={130}
          height={26}
          className="h-6 w-auto object-contain"
          priority
        />
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
