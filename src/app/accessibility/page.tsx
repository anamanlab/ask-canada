import { DocPage, docMetadata } from '../_doc/DocPage';

export const generateMetadata = () => docMetadata('accessibility');

export default function AccessibilityPage() {
  return <DocPage doc="accessibility" />;
}
