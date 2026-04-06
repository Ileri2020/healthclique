# 🚀 Skeleton System Quick Reference

## Import Skeletons

```tsx
import {
  ProductCardSkeleton,
  ProductGridSkeleton,
  TableSkeleton,
  KpiSectionSkeleton,
  ChartSkeleton,
  ProfileSkeleton,
  DialogSkeleton,
  CartPageSkeleton,
  FormSkeleton,
  PageSkeleton,
  TextBlockSkeleton
} from '@/components/skeletons';
```

## Quick Patterns

### 1. API Data Loading

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/endpoint')
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false); });
}, []);

return (
  <>
    {loading ? <ProductGridSkeleton count={12} /> : <ProductGrid data={data} />}
  </>
);
```

### 2. Table Loading

```tsx
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(true);

return (
  <>
    {loading ? (
      <TableSkeleton rows={8} columns={5} />
    ) : (
      <DataTable data={rows} />
    )}
  </>
);
```

### 3. Route-Level Loading (Auto on Navigation)

Create `app/route-name/loading.tsx`:

```tsx
import { ProductGridSkeleton } from '@/components/skeletons';

export default function Loading() {
  return <ProductGridSkeleton count={12} />;
}
```

### 4. Dialog Loading

```tsx
const [loading, setLoading] = useState(false);

return (
  <Dialog>
    <DialogContent>
      {loading ? <DialogSkeleton /> : <ActualContent />}
    </DialogContent>
  </Dialog>
);
```

### 5. Chart Loading

```tsx
const [loading, setLoading] = useState(true);

return (
  <>
    {loading ? (
      <ChartSkeleton />
    ) : (
      <ActualChart data={chartData} />
    )}
  </>
);
```

## Available Components

| Component | Use Case |
|-----------|----------|
| `Skeleton` | Base component (1 block) |
| `ProductCardSkeleton` | Single product |
| `ProductGridSkeleton` | Product listing grid |
| `TableSkeleton` | Data tables |
| `KpiCardSkeleton` | Single KPI |
| `KpiSectionSkeleton` | Multiple KPIs |
| `ChartSkeleton` | Analytics charts |
| `ProfileSkeleton` | User profile |
| `DialogSkeleton` | Modal/Dialog content |
| `FormSkeleton` | Form fields |
| `CartPageSkeleton` | Shopping cart |
| `PageSkeleton` | Full page layout |
| `TextBlockSkeleton` | Text paragraphs |
| `HeroSkeleton` | Hero banner |
| `BannerSkeleton` | Image banner |
| `CartItemSkeleton` | Cart item row |
| `SidebarWithContentSkeleton` | Sidebar + main |

## Customization

### Custom Skeletons

```tsx
// Create your own
export function CustomSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
```

### Adjust Shimmer Speed

Edit `app/globals.css`:

```css
@keyframes shimmer {
  -100% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite; /* Change time here */
  background-size: 200% 100%;
}
```

### Change Shimmer Colors

```tsx
<Skeleton className="bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100" />
```

## Best Practices

✅ **DO:**
- Match exact size of real components
- Use skeletons for all loading states
- Keep loading UI consistent
- Import from `@/components/skeletons`

❌ **DON'T:**
- Use spinners anymore (use skeletons)
- Show inconsistent layout sizes
- Make skeleton UI too different from real UI
- Import Skeleton directly for complex components

## Created Loading Routes

All these routes now auto-show skeletons on navigation:

```
✅ app/loading.tsx
✅ app/admin/loading.tsx
✅ app/admin/analytics/loading.tsx
✅ app/cart/loading.tsx
✅ app/account/loading.tsx
✅ app/store/loading.tsx
✅ app/products/loading.tsx
✅ app/products/[id]/loading.tsx
✅ app/blog/loading.tsx
✅ app/lunch/loading.tsx
✅ app/login/loading.tsx
✅ app/signup/loading.tsx
✅ app/contact/loading.tsx
✅ app/help/loading.tsx
```

## Files Changed

- ✅ `components/skeletons/index.tsx` - Created (15+ components)
- ✅ `components/ui/skeleton.tsx` - Enhanced with shimmer
- ✅ `app/globals.css` - Added shimmer animation
- ✅ `app/admin/analytics/page.tsx` - Updated
- ✅ `app/admin/page.tsx` - Updated
- ✅ `app/account/page.tsx` - Updated
- ✅ `app/cart/page.tsx` - Updated
- ✅ 14x `loading.tsx` files created

---

**Need help?** Reference `SKELETON_IMPLEMENTATION.md` for full details!
