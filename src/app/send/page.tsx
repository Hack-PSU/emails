import EmailForm from "@/app/send/email-form";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HackPSU Sponsorship Email System
          </h1>
          <p className="text-gray-600">
            Create and send personalized sponsorship invitations
          </p>
        </div>
        <EmailForm />
      </div>
    </main>
  );
}
