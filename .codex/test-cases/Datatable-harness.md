# DataTable Harness tesztesetek

Ez a dokumentum a [Datatable-harness.spec.ts](/c:/Users/Jozsi/WebstormProjects/MallBlitzV2/E2E/tests/admin/Datatable-harness.spec.ts) üzleti logikáját írja le.

A harness célja, hogy az általános DataTable viselkedést izolált, kontrollált környezetben ellenőrizze, függetlenül az éles admin oldalak konkrét adataitól.

## Közös előfeltétel

```gherkin
Adott egy mesterségesen felépített DataTable felület
És a táblázat ismert tesztadatokkal indul
És a vezérlők, oszlopok és menük determinisztikusan konfiguráltak
```

## 1. Custom cellák és opcionális oszlopok renderelése

```gherkin
Forgatókönyv: A táblázat képes egyedi cellatartalmat és opcionális oszlopokat kezelni
  Amikor a teljes értékű harness tábla betölt
  Akkor a következő fejlécek jelennek meg:
    | ID | Name | Status | Joined | Actions |
  És 10 adat sor látszik

  Amikor az admin megkeresi az "Ada Lovelace" sort
  Akkor a sor egyedi cellatartalmat is tartalmaz, például "Priority" jelölést

  Amikor a kompakt harness verzió töltődik be
  Akkor az "Actions" oszlop már nem jelenik meg
  És csak ezek a fejlécek látszanak:
    | ID | Name | Status | Joined |
```

Mit ellenőrzünk:
- A custom rendererrel készült cellák helyesen jelennek meg.
- Az opcionális selection/actions oszlopok konfiguráció alapján ki-be kapcsolhatók.

## 2. Tiltott és engedélyezett bulk / row actionök

```gherkin
Forgatókönyv: A bulk és row action állapotok a kijelöléstől függnek
  Amikor nincs egyetlen sor sem kijelölve
  Akkor a "View Selected" bulk action tiltott
  És az "Archive Selected" bulk action tiltott

  Amikor az admin kijelöli az "Ada Lovelace" sort
  Akkor a kijelölt sorok száma 1
  És a "View Selected" bulk action engedélyezett
  És az "Archive Selected" bulk action engedélyezett

  Amikor az admin megnyitja az adott sor műveleteit
  Akkor a "View" művelet engedélyezett
  És az "Archive" művelet tiltott
```

Mit ellenőrzünk:
- A bulk actionök állapota a selection állapothoz kötődik.
- A row actionök soronként különböző állapotot vehetnek fel.

## 3. Szűrő input módok dinamikus váltása

```gherkin
Forgatókönyv: A filter builder a mező típusa alapján vált input módot
  Amikor az admin megnyitja a Filter modalt

  És a mezőt "Text Field"-re állítja
  Akkor szöveges input jelenik meg

  És a mezőt "Number Field"-re állítja
  Akkor numerikus input jelenik meg

  És a mezőt "Date Field"-re állítja
  Akkor dátum tartomány input jelenik meg

  És a mezőt "Choice Field"-re állítja
  Akkor select mező jelenik meg

  És a mezőt "Active"-ra állítja
  Akkor boolean kapcsoló jelenik meg

  És a mezőt "Status"-ra állítja
  Akkor nincs külön érték mező
```

Mit ellenőrzünk:
- A filter builder típushelyesen vált a különböző input kontrollok között.
- A mező definíciója meghatározza a szükséges értékbeviteli módot.

## 4. Loading, empty state és pagination

```gherkin
Forgatókönyv: A tábla helyesen kezeli a betöltést, az üres állapotot és a lapozást
  Amikor a harness tábla első oldala betölt
  Akkor a pagination ezt mutatja:
    | Show 1 to 10 of 12 records |
    | Page 1 of 2 |

  Amikor az admin a következő oldalra lép
  Akkor a pagination ezt mutatja:
    | Show 11 to 12 of 12 records |
    | Page 2 of 2 |

  Amikor az admin frissítést indít
  Akkor a refresh gomb tiltott lesz
  És loading állapot jelenik meg

  Amikor a betöltés befejeződik
  Akkor a tábla visszatér normál állapotba

  Amikor az admin olyan keresést indít, amely nem talál rekordot
  Akkor az empty state jelenik meg
  És a pagination eltűnik
```

Mit ellenőrzünk:
- A lapozás helyesen számolja a tartományt és az oldalszámot.
- A refresh valódi loading állapotot idéz elő.
- Üres keresési eredmény esetén empty state jelenik meg, pagination nélkül.
