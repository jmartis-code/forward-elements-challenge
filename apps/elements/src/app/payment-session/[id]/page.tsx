import { PaymentSessionEventListener } from "./event-listener";

export type PaymentSessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentSessionPage({
  params,
}: PaymentSessionPageProps) {
  const { id } = await params;
  const session = await global.PaymentSessionStore.getById(id);

  if (!session) {
    return <div>Session not found</div>;
  }

  const url = `${process.env.NEXT_PUBLIC_URL}/payment-session/${id}`;

  // TODO: This should be a card form element
  return (
    <div>
      <PaymentSessionEventListener sessionUrl={url} />
    </div>
  );
}
