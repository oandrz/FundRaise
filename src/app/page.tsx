import { MenuItemCard } from '@/components/MenuItemCard';
import { menuItems } from '@/data/menu';

export default function MenuPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-center text-foreground">Our Menu</h1>
      <p className="text-center text-muted-foreground">Explore our delicious offerings and add items to your order.</p>
      
      {Object.entries(menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof menuItems>)).map(([category, items]) => (
        <section key={category} className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary border-b pb-2">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
