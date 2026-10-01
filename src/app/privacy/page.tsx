import { DocPage, docMetadata } from '../_doc/DocPage';

export const generateMetadata = () => docMetadata('privacy');

export default function PrivacyPage() {
  return <DocPage doc="privacy" />;
}
