import { DocPage, docMetadata } from '../_doc/DocPage';

export const generateMetadata = () => docMetadata('terms');

export default function TermsPage() {
  return <DocPage doc="terms" />;
}
