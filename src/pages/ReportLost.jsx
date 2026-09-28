import ItemReportForm from '../components/ItemReportForm.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function ReportLost() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Report"
        title="Report a Lost Item"
        subtitle="Tell us what you lost — our smart matcher will scan all found reports for you."
      />
      <ItemReportForm kind="lost" pageTitle="Report a Lost Item" />
    </div>
  );
}
