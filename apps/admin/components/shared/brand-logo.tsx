import Image from 'next/image';
import logo from '@/public/logo.jpg';

export function BrandLogo() {
  return <div className="brand-lockup">
    <span className="brand-image-frame">
      <Image src={logo} alt="BCM Products" width={160} height={160} priority className="brand-image" />
    </span>
  </div>;
}
