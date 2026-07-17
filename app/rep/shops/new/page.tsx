import { NewShopForm } from './NewShopForm';

/**
 * /rep/shops/new — server wrapper around the two-step NewShopForm.
 *
 * Role guard is owned by `app/rep/layout.tsx`. This page renders the
 * client form only.
 */

export default function NewShopPage() {
  return <NewShopForm />;
}
