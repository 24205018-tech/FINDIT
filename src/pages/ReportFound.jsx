import ItemReportForm from '../components/ItemReportForm.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function ReportFound() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Report"
        title="Report a Found Item"
        subtitle="Found something on campus? Report it here so the owner can find it through FindIt."
      />
      <ItemReportForm kind="found" pageTitle="Report a Found Item" />
    </div>
  );
}
