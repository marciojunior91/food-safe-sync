# 🚀 DIA 6 - RECIPES 100% + TEMPERATURE LOGS START

**Data:** 2026-01-22  
**Início:** 68% progress (Day 5 complete)  
**Meta:** 75% progress (+7%)  
**Estratégia:** Option B - Polish Recipes + Start Temps (5h total)

---

## 📋 PLANO DO DIA

### FASE 1: FINISH RECIPES MODULE (120 min) 🎯
**Objetivo:** Completar 100% do módulo Recipes

#### Task 1.1: BUG-015 - Structured Ingredients Input (60 min) ⚡ HIGH
**Status:** ⏸️ PENDING  
**Priority:** HIGH - CRITICAL para escalabilidade

**Current State:**
- ✅ RecipeDetailDialog já suporta display de ambos formatos (string[] e structured)
- ✅ Backward compatibility garantida
- ⏸️ CreateRecipeDialog ainda usa `<Textarea>` simples

**Goal:**
Refatorar CreateRecipeDialog para aceitar ingredients estruturados:

```typescript
interface StructuredIngredient {
  quantity: number;
  unit: string;
  name: string;
  notes?: string;
}
```

**Implementation Plan:**
1. **Create IngredientInput Component** (20 min)
   ```tsx
   <Card className="p-4 space-y-3">
     <div className="grid grid-cols-12 gap-2">
       <Input 
         type="number" 
         placeholder="Qty" 
         className="col-span-2"
         value={ingredient.quantity}
       />
       <Select value={ingredient.unit} className="col-span-3">
         <SelectTrigger><SelectValue /></SelectTrigger>
         <SelectContent>
           <SelectItem value="g">g (Grams)</SelectItem>
           <SelectItem value="kg">kg (Kilograms)</SelectItem>
           <SelectItem value="ml">ml (Milliliters)</SelectItem>
           <SelectItem value="L">L (Liters)</SelectItem>
           <SelectItem value="cups">Cups</SelectItem>
           <SelectItem value="tbsp">Tbsp</SelectItem>
           <SelectItem value="tsp">Tsp</SelectItem>
           <SelectItem value="pcs">Pieces</SelectItem>
         </SelectContent>
       </Select>
       <Input 
         placeholder="Ingredient name" 
         className="col-span-5"
         value={ingredient.name}
       />
       <Button variant="ghost" size="icon" className="col-span-2">
         <Trash2 className="w-4 h-4" />
       </Button>
     </div>
     <Input 
       placeholder="Notes (optional)" 
       className="text-sm"
       value={ingredient.notes}
     />
   </Card>
   ```

2. **Update CreateRecipeDialog State** (15 min)
   ```typescript
   const [ingredients, setIngredients] = useState<StructuredIngredient[]>([
     { quantity: 0, unit: 'g', name: '', notes: '' }
   ]);
   
   const addIngredient = () => {
     setIngredients([...ingredients, { quantity: 0, unit: 'g', name: '', notes: '' }]);
   };
   
   const removeIngredient = (index: number) => {
     setIngredients(ingredients.filter((_, i) => i !== index));
   };
   
   const updateIngredient = (index: number, field: keyof StructuredIngredient, value: any) => {
     const updated = [...ingredients];
     updated[index] = { ...updated[index], [field]: value };
     setIngredients(updated);
   };
   ```

3. **Add Ingredient List Preview** (10 min)
   ```tsx
   <div className="mt-4 p-3 bg-muted/50 rounded-md">
     <Label className="text-xs font-medium mb-2 block">Preview</Label>
     <ul className="text-sm space-y-1">
       {ingredients.map((ing, i) => (
         <li key={i} className="text-muted-foreground">
           • {ing.quantity} {ing.unit} {ing.name} {ing.notes && `(${ing.notes})`}
         </li>
       ))}
     </ul>
   </div>
   ```

4. **Add Validation** (10 min)
   ```typescript
   const validateIngredients = (): boolean => {
     return ingredients.every(ing => 
       ing.quantity > 0 && 
       ing.unit.trim() !== '' && 
       ing.name.trim() !== ''
     );
   };
   ```

5. **Save to Database** (5 min)
   ```typescript
   const { error } = await supabase
     .from('recipes')
     .insert([{
       // ... other fields
       ingredients: ingredients // ✅ Salva como JSON structured
     }]);
   ```

**Expected Outcome:**
- ✅ Structured ingredient input form
- ✅ Add/Remove ingredient rows
- ✅ Real-time preview
- ✅ Validation antes de save
- ✅ Backward compatibility mantida (RecipeDetailDialog já suporta)

**Migration Strategy:**
- ⏸️ **Fase 1 (Day 6):** Novo formato opcional (CreateRecipeDialog aceita structured)
- ⏸️ **Fase 2 (Day 7-8):** Migration script para converter antigas
- ⏸️ **Fase 3 (Post-MVP):** Tornar structured obrigatório

---

#### Task 1.2: ENHANCEMENT 6 - Advanced Recipe Filters (60 min) 📊 MEDIUM
**Status:** ⏸️ PENDING  
**Priority:** MEDIUM - Nice-to-have para power users

**Current State:**
- ✅ Search por nome, allergen, dietary
- ✅ Filter por category
- ✅ Sort por 6 critérios
- ⏸️ Sem filtros avançados (exclude allergen, dietary requirement, prep time, hold time)

**Goal:**
Adicionar filtros avançados para busca granular de receitas.

**Implementation Plan:**
1. **Add Filter State** (10 min)
   ```typescript
   const [excludeAllergen, setExcludeAllergen] = useState<string | null>(null);
   const [dietaryRequirement, setDietaryRequirement] = useState<string | null>(null);
   const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
   const [minHoldTime, setMinHoldTime] = useState<number | null>(null);
   ```

2. **Create FilterPanel Component** (20 min)
   ```tsx
   <Card className="mb-4">
     <CardHeader>
       <div className="flex items-center justify-between">
         <CardTitle className="text-base">Advanced Filters</CardTitle>
         <Button 
           variant="ghost" 
           size="sm"
           onClick={clearAllFilters}
           disabled={!hasActiveFilters}
         >
           Clear All
         </Button>
       </div>
     </CardHeader>
     <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {/* Exclude Allergen */}
       <div className="space-y-2">
         <Label>Exclude Allergen</Label>
         <Select value={excludeAllergen || "none"} onValueChange={...}>
           <SelectTrigger><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value="none">No Exclusion</SelectItem>
             {COMMON_ALLERGENS.map(allergen => (
               <SelectItem key={allergen} value={allergen}>
                 ⚠️ {allergen}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
       
       {/* Dietary Requirement */}
       <div className="space-y-2">
         <Label>Dietary Requirement</Label>
         <Select value={dietaryRequirement || "none"} onValueChange={...}>
           <SelectTrigger><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value="none">No Requirement</SelectItem>
             {DIETARY_REQUIREMENTS.map(diet => (
               <SelectItem key={diet} value={diet}>
                 ✓ {diet}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
       
       {/* Max Prep Time */}
       <div className="space-y-2">
         <Label>Max Prep Time (min)</Label>
         <Input 
           type="number" 
           placeholder="e.g., 60"
           value={maxPrepTime || ""}
           onChange={(e) => setMaxPrepTime(Number(e.target.value) || null)}
         />
       </div>
       
       {/* Min Hold Time */}
       <div className="space-y-2">
         <Label>Min Hold Time (days)</Label>
         <Input 
           type="number" 
           placeholder="e.g., 3"
           value={minHoldTime || ""}
           onChange={(e) => setMinHoldTime(Number(e.target.value) || null)}
         />
       </div>
     </CardContent>
   </Card>
   ```

3. **Update Filter Logic** (15 min)
   ```typescript
   const filteredRecipes = recipes
     .filter(recipe => {
       // Existing filters (search, category)
       const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (recipe.allergens || []).some(allergen => 
           allergen.toLowerCase().includes(searchTerm.toLowerCase())
         ) ||
         (recipe.dietary_requirements || []).some(dietary => 
           dietary.toLowerCase().includes(searchTerm.toLowerCase())
         );
       
       const matchesCategory = selectedCategory === "All Categories" || 
         recipe.category === selectedCategory;
       
       // NEW: Advanced filters
       const matchesAllergen = !excludeAllergen || 
         !(recipe.allergens || []).includes(excludeAllergen);
       
       const matchesDietary = !dietaryRequirement || 
         (recipe.dietary_requirements || []).includes(dietaryRequirement);
       
       const matchesPrepTime = !maxPrepTime || 
         (recipe.estimated_prep_minutes || 0) <= maxPrepTime;
       
       const matchesHoldTime = !minHoldTime || 
         recipe.hold_time_days >= minHoldTime;
       
       return matchesSearch && matchesCategory && 
              matchesAllergen && matchesDietary && 
              matchesPrepTime && matchesHoldTime;
     })
     .sort((a, b) => {
       // ... existing sort logic
     });
   ```

4. **Add Filter Toggle** (10 min)
   ```tsx
   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
   
   <Button 
     variant="outline" 
     size="sm"
     onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
   >
     <Filter className="w-4 h-4 mr-2" />
     Advanced Filters
     {hasActiveFilters && (
       <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
     )}
   </Button>
   ```

5. **Add Constants** (5 min)
   ```typescript
   const COMMON_ALLERGENS = [
     "Dairy", "Eggs", "Fish", "Shellfish", 
     "Tree Nuts", "Peanuts", "Wheat", "Soy"
   ];
   
   const DIETARY_REQUIREMENTS = [
     "Vegetarian", "Vegan", "Gluten-Free", 
     "Dairy-Free", "Nut-Free", "Keto", 
     "Paleo", "Low-Carb", "Halal", "Kosher"
   ];
   ```

**Expected Outcome:**
- ✅ Collapsible advanced filter panel
- ✅ 4 additional filter criteria
- ✅ Active filter count badge
- ✅ Clear All button
- ✅ Filters persist during session

---

### FASE 2: START TEMPERATURE LOGS MODULE (150 min) 🌡️
**Objetivo:** Implementar funcionalidade básica de temperature monitoring

#### Task 2.1: Create TemperatureLogs Page (60 min) 🆕
**Status:** ⏸️ PENDING  
**Priority:** HIGH - Core compliance feature

**Goal:**
Criar página básica para registro de temperaturas de equipamentos.

**Database Schema (já existe):**
```sql
-- temperature_logs table
CREATE TABLE temperature_logs (
  id UUID PRIMARY KEY,
  equipment_type TEXT NOT NULL, -- 'refrigerator', 'freezer', 'hot_hold', 'cold_display'
  equipment_name TEXT NOT NULL,
  temperature DECIMAL(5,2) NOT NULL, -- 12.5°C format
  unit TEXT NOT NULL DEFAULT 'celsius', -- 'celsius' or 'fahrenheit'
  threshold_min DECIMAL(5,2), -- Min safe temp
  threshold_max DECIMAL(5,2), -- Max safe temp
  is_within_range BOOLEAN,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Plan:**

1. **Create TemperatureLogs.tsx Page** (20 min)
   ```tsx
   export default function TemperatureLogs() {
     const [logs, setLogs] = useState<TemperatureLog[]>([]);
     const [loading, setLoading] = useState(true);
     const [showEntryDialog, setShowEntryDialog] = useState(false);
     
     return (
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Temperature Logs</h1>
             <p className="text-muted-foreground">
               Monitor and record equipment temperatures for compliance
             </p>
           </div>
           <Button onClick={() => setShowEntryDialog(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Record Temperature
           </Button>
         </div>
         
         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatsCard title="Total Today" value="24" icon={<Thermometer />} />
           <StatsCard title="Within Range" value="22" variant="success" />
           <StatsCard title="Out of Range" value="2" variant="destructive" />
           <StatsCard title="Equipment" value="8" />
         </div>
         
         {/* Temperature Log Table */}
         <Card>
           <CardHeader>
             <CardTitle>Recent Temperature Readings</CardTitle>
           </CardHeader>
           <CardContent>
             <TemperatureLogTable logs={logs} />
           </CardContent>
         </Card>
         
         {/* Entry Dialog */}
         <TemperatureEntryDialog 
           open={showEntryDialog}
           onOpenChange={setShowEntryDialog}
           onSuccess={fetchLogs}
         />
       </div>
     );
   }
   ```

2. **Create TemperatureLog Interface** (5 min)
   ```typescript
   interface TemperatureLog {
     id: string;
     equipment_type: 'refrigerator' | 'freezer' | 'hot_hold' | 'cold_display';
     equipment_name: string;
     temperature: number;
     unit: 'celsius' | 'fahrenheit';
     threshold_min: number | null;
     threshold_max: number | null;
     is_within_range: boolean;
     recorded_by: string;
     recorded_at: string;
     notes: string | null;
     recorder?: {
       display_name: string;
     };
   }
   ```

3. **Implement Fetch Logs** (15 min)
   ```typescript
   const fetchLogs = async () => {
     try {
       setLoading(true);
       const { data, error } = await supabase
         .from('temperature_logs')
         .select(`
           *,
           recorder:recorded_by (
             display_name
           )
         `)
         .order('recorded_at', { ascending: false })
         .limit(100);
       
       if (error) throw error;
       setLogs(data || []);
     } catch (error) {
       console.error('Error fetching temperature logs:', error);
       toast({
         title: "Error",
         description: "Failed to load temperature logs",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
   ```

4. **Create StatsCard Component** (10 min)
   ```tsx
   function StatsCard({ 
     title, 
     value, 
     icon, 
     variant = "default" 
   }: {
     title: string;
     value: string | number;
     icon?: React.ReactNode;
     variant?: "default" | "success" | "destructive";
   }) {
     return (
       <Card>
         <CardContent className="pt-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-muted-foreground">{title}</p>
               <p className={cn(
                 "text-2xl font-bold",
                 variant === "success" && "text-green-600",
                 variant === "destructive" && "text-red-600"
               )}>
                 {value}
               </p>
             </div>
             {icon && (
               <div className={cn(
                 "p-3 rounded-full",
                 variant === "default" && "bg-primary/10 text-primary",
                 variant === "success" && "bg-green-100 text-green-600",
                 variant === "destructive" && "bg-red-100 text-red-600"
               )}>
                 {icon}
               </div>
             )}
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

5. **Add to Navigation** (10 min)
   Update `src/components/Sidebar.tsx`:
   ```tsx
   {
     name: "Temperature Logs",
     href: "/temperature-logs",
     icon: Thermometer,
     current: location.pathname === "/temperature-logs"
   }
   ```

**Expected Outcome:**
- ✅ New `/temperature-logs` route
- ✅ Stats cards showing summary
- ✅ Temperature log table (basic)
- ✅ "Record Temperature" button
- ✅ Navigation link added

---

#### Task 2.2: Temperature Entry Dialog (45 min) 📝
**Status:** ⏸️ PENDING  
**Priority:** HIGH - Core input functionality

**Goal:**
Form dialog para registrar nova temperatura.

**Implementation Plan:**

1. **Create TemperatureEntryDialog Component** (25 min)
   ```tsx
   export function TemperatureEntryDialog({
     open,
     onOpenChange,
     onSuccess
   }: {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     onSuccess: () => void;
   }) {
     const [equipmentType, setEquipmentType] = useState<string>('');
     const [equipmentName, setEquipmentName] = useState<string>('');
     const [temperature, setTemperature] = useState<string>('');
     const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
     const [notes, setNotes] = useState<string>('');
     const [saving, setSaving] = useState(false);
     
     // Equipment thresholds
     const thresholds = {
       refrigerator: { min: 0, max: 5 }, // 0-5°C
       freezer: { min: -25, max: -18 }, // -25 to -18°C
       hot_hold: { min: 60, max: 85 }, // 60-85°C
       cold_display: { min: 0, max: 8 } // 0-8°C
     };
     
     const handleSubmit = async () => {
       if (!equipmentType || !equipmentName || !temperature) {
         toast({
           title: "Missing Information",
           description: "Please fill in all required fields",
           variant: "destructive"
         });
         return;
       }
       
       const tempValue = parseFloat(temperature);
       const threshold = thresholds[equipmentType as keyof typeof thresholds];
       const isWithinRange = tempValue >= threshold.min && tempValue <= threshold.max;
       
       setSaving(true);
       
       try {
         const { error } = await supabase
           .from('temperature_logs')
           .insert([{
             equipment_type: equipmentType,
             equipment_name: equipmentName,
             temperature: tempValue,
             unit: unit,
             threshold_min: threshold.min,
             threshold_max: threshold.max,
             is_within_range: isWithinRange,
             notes: notes || null,
             recorded_by: user?.id,
             recorded_at: new Date().toISOString()
           }]);
         
         if (error) throw error;
         
         toast({
           title: isWithinRange ? "Temperature Recorded" : "⚠️ Temperature Alert",
           description: isWithinRange 
             ? "Temperature is within safe range" 
             : `Temperature is OUT OF RANGE! (Expected: ${threshold.min}-${threshold.max}°${unit === 'celsius' ? 'C' : 'F'})`,
           variant: isWithinRange ? "default" : "destructive"
         });
         
         onSuccess();
         resetForm();
         onOpenChange(false);
       } catch (error) {
         console.error('Error saving temperature:', error);
         toast({
           title: "Error",
           description: "Failed to record temperature",
           variant: "destructive"
         });
       } finally {
         setSaving(false);
       }
     };
     
     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Record Temperature</DialogTitle>
             <DialogDescription>
               Enter the current temperature reading for your equipment
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             {/* Equipment Type */}
             <div className="space-y-2">
               <Label>Equipment Type *</Label>
               <Select value={equipmentType} onValueChange={setEquipmentType}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select equipment type..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="refrigerator">
                     <div className="flex items-center gap-2">
                       <Snowflake className="w-4 h-4" />
                       Refrigerator (0-5°C)
                     </div>
                   </SelectItem>
                   <SelectItem value="freezer">
                     <div className="flex items-center gap-2">
                       <Snowflake className="w-4 h-4" />
                       Freezer (-25 to -18°C)
                     </div>
                   </SelectItem>
                   <SelectItem value="hot_hold">
                     <div className="flex items-center gap-2">
                       <Flame className="w-4 h-4" />
                       Hot Hold (60-85°C)
                     </div>
                   </SelectItem>
                   <SelectItem value="cold_display">
                     <div className="flex items-center gap-2">
                       <Snowflake className="w-4 h-4" />
                       Cold Display (0-8°C)
                     </div>
                   </SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             {/* Equipment Name */}
             <div className="space-y-2">
               <Label>Equipment Name *</Label>
               <Input 
                 placeholder="e.g., Walk-in Cooler #1"
                 value={equipmentName}
                 onChange={(e) => setEquipmentName(e.target.value)}
               />
             </div>
             
             {/* Temperature */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Temperature *</Label>
                 <Input 
                   type="number"
                   step="0.1"
                   placeholder="e.g., 3.5"
                   value={temperature}
                   onChange={(e) => setTemperature(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Unit</Label>
                 <Select value={unit} onValueChange={(val) => setUnit(val as 'celsius' | 'fahrenheit')}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="celsius">°C (Celsius)</SelectItem>
                     <SelectItem value="fahrenheit">°F (Fahrenheit)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
             
             {/* Threshold Warning */}
             {equipmentType && temperature && (
               <Alert variant={
                 parseFloat(temperature) >= thresholds[equipmentType as keyof typeof thresholds].min &&
                 parseFloat(temperature) <= thresholds[equipmentType as keyof typeof thresholds].max
                   ? "default"
                   : "destructive"
               }>
                 <AlertTriangle className="w-4 h-4" />
                 <AlertDescription>
                   Expected range: {thresholds[equipmentType as keyof typeof thresholds].min}°{unit === 'celsius' ? 'C' : 'F'} 
                   {' to '}
                   {thresholds[equipmentType as keyof typeof thresholds].max}°{unit === 'celsius' ? 'C' : 'F'}
                 </AlertDescription>
               </Alert>
             )}
             
             {/* Notes */}
             <div className="space-y-2">
               <Label>Notes (Optional)</Label>
               <Textarea 
                 placeholder="Any additional observations..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 rows={3}
               />
             </div>
           </div>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={saving}>
               {saving ? "Recording..." : "Record Temperature"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

**Expected Outcome:**
- ✅ Temperature entry form dialog
- ✅ Equipment type selector with icons
- ✅ Real-time threshold validation
- ✅ Alert for out-of-range temps
- ✅ Notes field for observations
- ✅ Auto-calculation of is_within_range

---

#### Task 2.3: Temperature Log Table (45 min) 📊
**Status:** ⏸️ PENDING  
**Priority:** HIGH - Data display

**Goal:**
Table component para exibir historical temperature logs.

**Implementation Plan:**

1. **Create TemperatureLogTable Component** (30 min)
   ```tsx
   export function TemperatureLogTable({ 
     logs 
   }: { 
     logs: TemperatureLog[] 
   }) {
     const [filter, setFilter] = useState<string>('all'); // 'all', 'in_range', 'out_of_range'
     
     const filteredLogs = logs.filter(log => {
       if (filter === 'in_range') return log.is_within_range;
       if (filter === 'out_of_range') return !log.is_within_range;
       return true;
     });
     
     return (
       <div className="space-y-4">
         {/* Filter Tabs */}
         <div className="flex items-center gap-2">
           <Button 
             variant={filter === 'all' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('all')}
           >
             All Logs
           </Button>
           <Button 
             variant={filter === 'in_range' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('in_range')}
           >
             ✓ Within Range
           </Button>
           <Button 
             variant={filter === 'out_of_range' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('out_of_range')}
           >
             ⚠️ Out of Range
           </Button>
         </div>
         
         {/* Table */}
         <div className="rounded-md border">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Status</TableHead>
                 <TableHead>Equipment</TableHead>
                 <TableHead>Temperature</TableHead>
                 <TableHead>Range</TableHead>
                 <TableHead>Recorded By</TableHead>
                 <TableHead>Time</TableHead>
                 <TableHead>Notes</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredLogs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                     No temperature logs found
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredLogs.map((log) => (
                   <TableRow 
                     key={log.id}
                     className={cn(
                       !log.is_within_range && "bg-red-50 dark:bg-red-900/10"
                     )}
                   >
                     <TableCell>
                       {log.is_within_range ? (
                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                           ✓ OK
                         </Badge>
                       ) : (
                         <Badge variant="destructive">
                           ⚠️ Alert
                         </Badge>
                       )}
                     </TableCell>
                     <TableCell>
                       <div>
                         <div className="font-medium">{log.equipment_name}</div>
                         <div className="text-xs text-muted-foreground capitalize">
                           {log.equipment_type.replace('_', ' ')}
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className={cn(
                         "font-mono font-bold",
                         !log.is_within_range && "text-red-600"
                       )}>
                         {log.temperature.toFixed(1)}°{log.unit === 'celsius' ? 'C' : 'F'}
                       </div>
                     </TableCell>
                     <TableCell className="text-sm text-muted-foreground">
                       {log.threshold_min !== null && log.threshold_max !== null ? (
                         `${log.threshold_min}° to ${log.threshold_max}°`
                       ) : (
                         'N/A'
                       )}
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-muted-foreground" />
                         <span>{log.recorder?.display_name || 'Unknown'}</span>
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm">
                         <div>{format(new Date(log.recorded_at), 'MMM dd, yyyy')}</div>
                         <div className="text-xs text-muted-foreground">
                           {format(new Date(log.recorded_at), 'HH:mm')}
                         </div>
                       </div>
                     </TableCell>
                     <TableCell className="max-w-[200px]">
                       {log.notes ? (
                         <div className="text-sm text-muted-foreground truncate">
                           {log.notes}
                         </div>
                       ) : (
                         <span className="text-xs text-muted-foreground">No notes</span>
                       )}
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
       </div>
     );
   }
   ```

2. **Add Export Functionality** (15 min)
   ```tsx
   const exportToCSV = () => {
     const headers = ['Date', 'Time', 'Equipment Type', 'Equipment Name', 'Temperature', 'Unit', 'Status', 'Range', 'Recorded By', 'Notes'];
     const rows = filteredLogs.map(log => [
       format(new Date(log.recorded_at), 'yyyy-MM-dd'),
       format(new Date(log.recorded_at), 'HH:mm'),
       log.equipment_type,
       log.equipment_name,
       log.temperature.toFixed(1),
       log.unit,
       log.is_within_range ? 'OK' : 'OUT OF RANGE',
       `${log.threshold_min}-${log.threshold_max}`,
       log.recorder?.display_name || 'Unknown',
       log.notes || ''
     ]);
     
     const csv = [headers, ...rows]
       .map(row => row.map(cell => `"${cell}"`).join(','))
       .join('\n');
     
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `temperature-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
     a.click();
   };
   
   // Add Export button
   <Button onClick={exportToCSV} variant="outline" size="sm">
     <Download className="w-4 h-4 mr-2" />
     Export CSV
   </Button>
   ```

**Expected Outcome:**
- ✅ Temperature log table with status indicators
- ✅ Filter tabs (All / Within Range / Out of Range)
- ✅ Visual alerts for out-of-range temps (red background)
- ✅ Export to CSV for compliance records
- ✅ Formatted timestamps
- ✅ Equipment details display

---

## 📊 SUMMARY

### Time Allocation
```
RECIPES FINISH:       120 min (2h)
├── Structured Ingredients: 60 min
└── Advanced Filters:       60 min

TEMPERATURE LOGS:     150 min (2.5h)
├── Page Creation:          60 min
├── Entry Dialog:           45 min
└── Log Table:              45 min

TOTAL:                270 min (4.5h)
```

### Progress Target
```
Start:  68% (Day 5 complete)
+7%:    Recipes 100% + Temps Start
End:    75% ✅
```

### Deliverables
**Recipes Module (100%):**
- ✅ Structured ingredients input
- ✅ Advanced filter panel
- ✅ Recipe detail dialog
- ✅ Duplicate feature
- ✅ Sorting (6 options)
- ✅ Better empty states
- ✅ Allergen warnings

**Temperature Logs Module (40%):**
- ✅ Basic page structure
- ✅ Temperature entry form
- ✅ Log history table
- ✅ Status indicators
- ✅ CSV export
- ⏸️ Charts (Day 7)
- ⏸️ Equipment management (Day 7)

---

## 🎯 SUCCESS CRITERIA

### Must Have ✅
- [ ] Structured ingredients form functional
- [ ] Advanced filters working (4 filter types)
- [ ] Temperature logs page accessible
- [ ] Temperature entry saves to database
- [ ] Out-of-range alerts show correctly
- [ ] 0 TypeScript errors

### Nice to Have 🌟
- [ ] Ingredient input auto-suggestions
- [ ] Filter persistence (localStorage)
- [ ] Temperature charts preview
- [ ] Batch temperature entry

### Testing Checklist 🧪
- [ ] Create recipe with structured ingredients
- [ ] View recipe in detail dialog (structured format)
- [ ] Apply advanced filters (all 4 types)
- [ ] Record temperature (within range)
- [ ] Record temperature (out of range)
- [ ] Export temperature logs to CSV

---

## 🚀 PRÓXIMOS PASSOS (Day 7)

After Day 6 completion (75%), Day 7 will focus on:

1. **Temperature Logs Polish** (90 min)
   - Charts (line graph, trend analysis)
   - Equipment registration
   - Scheduled reminders

2. **Equipment Maintenance Module Start** (120 min)
   - Equipment registry
   - Maintenance schedules
   - Service logs

**Target:** 83% progress (75% → 83% = +8%)

---

**🔥 LET'S GO! MARCHA FIO! 🔥**

Ready to start Day 6 implementation? Let me know and we'll begin with Task 1.1 (Structured Ingredients) or Task 2.1 (Temperature Logs page) - your choice! 💪🚀
