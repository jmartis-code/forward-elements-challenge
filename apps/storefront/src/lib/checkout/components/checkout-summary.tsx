import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableHeader,
  TableCaption,
} from "@fwd/ui/components/table";
import type { CartItem } from "@/lib/cart/cart.types";

export function CheckoutSummary({ cart }: { cart: CartItem[] }) {
  const sum = cart
    .reduce((acc, item) => acc + item.price * item.quantity, 0)
    .toFixed(2);
  const groupById = cart.reduce((acc, item) => {
    if (acc[item.id]) {
      acc[item.id]!.quantity += 1;
    } else {
      acc[item.id] = {
        ...item,
        quantity: 1,
      };
    }

    return acc;
  }, {} as Record<string, CartItem>);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Cart Summary</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(groupById).map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>${item.price.toFixed(2)}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right">
              Total
            </TableCell>
            <TableCell>${sum}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
