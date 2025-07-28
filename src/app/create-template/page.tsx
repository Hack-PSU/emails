import TemplateCreator from "./template-creator";

export default function CreateTemplatePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Temporary Template
          </h1>
          <p className="text-gray-600">
            Upload a custom email template and send personalized emails
          </p>
        </div>
        <TemplateCreator />
      </div>
    </main>
  );
}
