/**
 * The landing page (Server Component), one component per section (./sections). Interactive pieces are small
 * client islands. Every section renders its content without JavaScript; motion is layered on top.
 */
import './landing.css';
import { Footer } from '@/components/site/Footer';
import { getLandingCopy } from './copy';
import { Closing } from './sections/Closing';
import { FlagDemo } from './sections/FlagDemo';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { PrivacyNight } from './sections/PrivacyNight';
import { ServicesDirectory } from './sections/ServicesDirectory';
import { SourcesSection } from './sections/SourcesSection';
import { ToolsShowcase } from './sections/ToolsShowcase';

export async function Landing() {
  const { t } = await getLandingCopy();
  return (
    <>
      <a href="#ask" className="skip-link">
        {t('a11y.skipToAsk')}
      </a>
      <Hero />
      <ToolsShowcase />
      <FlagDemo />
      <HowItWorks />
      <PrivacyNight />
      <SourcesSection />
      <ServicesDirectory />
      <Closing />
      <Footer />
    </>
  );
}
