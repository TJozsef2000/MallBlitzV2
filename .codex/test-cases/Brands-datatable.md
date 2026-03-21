# Brands DataTable tesztesetek

Ez a dokumentum a [Brands-datatable.spec.ts](/c:/Users/Jozsi/WebstormProjects/MallBlitzV2/E2E/tests/admin/Brands-datatable.spec.ts) üzleti logikáját írja le.

## Közös előfeltétel

```gherkin
Adott egy bejelentkezett admin felhasználó
És megnyitja az Admin / Products / Brands oldalt
És megvárja, amíg a DataTable betölt
```

## 1. Közös toolbar és fejlécek megjelenítése

```gherkin
Forgatókönyv: A brand lista közös DataTable eszköztára látható
  Amikor az admin megnyitja a Brands oldalt
  Akkor látható az "Actions" gomb
  És látható a "Filter" gomb
  És látható a "Refresh" gomb
  És látható a "Columns" gomb
  És a táblázatban a következő fejlécek jelennek meg:
    | ID | Logo | Brand Name | Website | Status | Featured | Products | Order | Created | Actions |
```

Mit ellenőrzünk:
- A shared DataTable toolbar a brands oldalon is jelen van.
- A brands tábla a várt oszlopkészlettel renderelődik.

## 2. Üres állapot keresés után

```gherkin
Forgatókönyv: A keresés üres állapotot eredményez
  Amikor az admin olyan keresést indít, amely nem ad találatot
  Akkor a "No brands found" üres állapot jelenik meg
  És megjelenik a hozzá tartozó leírás
  És a keresőmező továbbra is látható
  És a "Filter" gomb továbbra is látható
```

Mit ellenőrzünk:
- Az empty state megfelelően jelenik meg üres eredményhalmaz esetén.
- A kereső és szűrő belépési pontok üres állapotban sem tűnnek el.

## 3. Fix ID oszlop és elrejtett pagination üres állapotban

```gherkin
Forgatókönyv: Üres találatlista mellett az ID oszlop zárolt és nincs lapozás
  Amikor az admin olyan keresést indít, amely nem ad találatot
  És megnyitja az oszlopválasztót
  Akkor az ID oszlop kapcsolója tiltott állapotú
  És a pagination nem jelenik meg
```

Mit ellenőrzünk:
- Az ID oszlop brands nézetben sem rejthető el.
- Üres állapotban a lapozó nem jelenik meg feleslegesen.
