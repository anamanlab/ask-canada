import { DocPage, docMetadata } from '../_doc/DocPage';

export const generateMetadata = () => docMetadata('about');

export default function AboutPage() {
  return <DocPage doc="about" />;
}
