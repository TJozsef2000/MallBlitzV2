# Users DataTable tesztesetek

Ez a dokumentum az [Users-datatable.spec.ts](/c:/Users/Jozsi/WebstormProjects/MallBlitzV2/E2E/tests/admin/Users-datatable.spec.ts) üzleti logikáját írja le.

## Közös előfeltétel

```gherkin
Adott egy bejelentkezett admin felhasználó
És megnyitja az Admin / Users oldalt
És megvárja, amíg a DataTable betölt
És a táblázat alapértelmezetten 10 sort mutat
```

## 1. Fejlécek és alapértelmezett sorok megjelenítése

```gherkin
Forgatókönyv: A felhasználói tábla alap nézete helyesen jelenik meg
  Amikor az admin megnyitja a Users oldalt
  Akkor a táblázatban a következő fejlécek látszanak:
    | ID | User | Email | Status | Role | Joined | Actions |
  És pontosan 10 adat sor jelenik meg
```

Mit ellenőrzünk:

- A táblázat szerkezete helyes.
- A látható oszlopok sorrendje megfelel az elvárásnak.
- Az alap pagination állapotból 10 rekord látszik.

## 2. Keresés, törlés és rendezés

```gherkin
Forgatókönyv: A keresés és rendezés működik a felhasználói táblában
  Amikor az admin a keresőbe beírja, hogy "lawrence"
  Akkor a tábla 1 sorra szűkül
  És a megjelenő sor tartalmazza "Lawrence Barrows" nevét

  Amikor az admin törli a keresési feltételt
  Akkor a tábla újra 10 sort mutat

  Amikor az admin ID szerint növekvő sorrendbe rendez
  Akkor az ID oszlop értékei növekvő sorrendben jelennek meg

  Amikor az admin ID szerint csökkenő sorrendbe rendez
  Akkor az ID oszlop értékei csökkenő sorrendben jelennek meg
```

Mit ellenőrzünk:

- A keresőmező valóban szűri a látható eredményeket.
- A keresés törlése visszaállítja az eredeti listát.
- A rendezés felhasználói nézőpontból ténylegesen átrendezi a sorokat.

## 3. Sor kattintás és interaktív elemek elkülönítése

```gherkin
Forgatókönyv: A sorra kattintás navigál, de a soron belüli interakciók nem
  Amikor az admin kijelöl egy sort a checkbox segítségével
  Akkor az oldal URL-je nem változik

  Amikor az admin megnyitja ugyanannak a sornak a műveleti menüjét
  Akkor az oldal URL-je továbbra sem változik
  És a "View" művelet elérhető

  Amikor az admin magára a sorra kattint
  Akkor a rendszer a felhasználó részletező oldalára navigál
```

Mit ellenőrzünk:

- A checkbox kattintás nem viselkedik sor-kattintásként.
- A row action trigger nem indít navigációt.
- A tényleges sor-kattintás megnyitja a részletező oldalt.

## 4. Bulk actionök, szűrő logika és szűrő visszatöltése

```gherkin
Forgatókönyv: A bulk actionök és a szűrő modal állapota helyes
  Amikor nincs egyetlen sor sem kijelölve
  Akkor a kiválasztott sorok számlálója nem látszik
  És a "Mark as Verified" bulk action tiltott
  És a "Mark as Unverified" bulk action tiltott
  És a "Delete Selected" bulk action tiltott

  Amikor az admin kijelöl egy felhasználót
  Akkor a kiválasztott sorok számlálója 1-et mutat
  És a "Mark as Verified" bulk action engedélyezett
  És a "Mark as Unverified" bulk action engedélyezett
  És a "Delete Selected" bulk action engedélyezett

  Amikor az admin megnyitja a Filter modalt és a mezőt "Name"-re állítja
  Akkor szöveges input jelenik meg

  Amikor a mezőt "Verification Status"-ra állítja
  Akkor nincs külön érték mező

  Amikor a mezőt "Created Date"-re állítja
  Akkor dátum tartomány input jelenik meg

  Amikor a mezőt "Name", az operátort "Contains", az értéket pedig "Lawrence"-re állítja
  És alkalmazza a szűrőt
  Akkor a tábla 1 sorra szűkül

  Amikor újra megnyitja a Filter modalt
  Akkor a korábban beállított mező, operátor és érték visszatöltődik

  Amikor törli a szűrőt
  Akkor a tábla újra 10 sort mutat
```

Mit ellenőrzünk:

- A bulk actionök csak kijelölés után aktiválódnak.
- A filter builder a kiválasztott mező típusa alapján vált input módot.
- Az alkalmazott szűrő ténylegesen visszatölthető.
- A szűrő törlése visszaállítja az eredeti táblaállapotot.

## 5. Oszlop láthatóság, frissítés és lapozás

```gherkin
Forgatókönyv: Az oszlopkezelés, frissítés és pagination működik
  Amikor az Email oszlop látható
  Akkor az oszlop fejléc megjelenik

  Amikor az admin elrejti az Email oszlopot
  Akkor az Email fejléc eltűnik

  Amikor az admin újra láthatóvá teszi az Email oszlopot
  Akkor az Email fejléc újra megjelenik

  Amikor az admin megnyitja az oszlopválasztót
  Akkor az ID oszlop kapcsolója tiltott állapotú

  Amikor az admin frissíti a táblát
  Akkor a refresh gomb betöltés közben tiltott

  Amikor az admin 25 sor / oldal értékre vált
  Akkor 25 adat sor jelenik meg
  És a pagination szöveg ezt mutatja:
    | Show 1 to 25 of 25 records |
    | Page 1 of 1 |

  Amikor az admin visszavált 10 sor / oldal értékre
  És a következő oldalra lép
  Akkor a pagination szöveg ezt mutatja:
    | Show 11 to 20 of 25 records |
    | Page 2 of 3 |

  Amikor az admin visszalép az előző oldalra
  Akkor a pagination szöveg ezt mutatja:
    | Show 1 to 10 of 25 records |
    | Page 1 of 3 |
```

Mit ellenőrzünk:

- Az oszlopelrejtés és visszaállítás a felületen is megjelenik.
- Az ID oszlop nem rejthető el.
- A refresh betöltési állapotot mutat.
- A lapozás és az oldalankénti elemszám a UI-ban is helyesen tükröződik.
