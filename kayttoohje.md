# Käyttöohje

## Tuetut kurssit

Saat oman kurssisi listalle ottamalla yhteyttä ylläpitotiimiin grp-toska@helsinki.fi.

## Suoritusten raportointi

1. Avaa [suoritustarkistin](https://toska.cs.helsinki.fi/suoritustarkistin/).
2. Valitse arvostelija ja kurssi riippuvalikoista, muokkaa halutessasi päivämäärä sopivaksi, ja lisää arvostelijatunnuksesi.

- Jos sinulla ei ole arvostelijatunnusta, ota yhteyttä ylläpitotiimiin grp-toska@helsinki.fi.

3. Lisää tekstitiedosto (.txt, .csv, tai .dat -muotoisena) joko raahaamalla, tai klikkaamalla.

- Katso tiedoston muotoiluohjeet alta.

4. Mikäli kaikki on kunnossa, 'Lähetä raportti'-nappi aktivoituu, ja voit klikata sitä lähettämällä raportin eteenpäin opintotoimistolle.

## Suoritustiedoston muotoilu

Tiedostossa suoritukset merkitään järjestyksessä:

`opiskelijanumero;arvosana;laajuus;kieli`

Opiskelijanumero on pakollinen, muut tiedot täydennetään tarvittaessa kurssin oletusasetuksista. Mikäli arvosanaa ei anneta, merkitään arvosanaksi "Hyv.".

#### Esimerkkejä hyväksyttävistä riveistä

```
010000003;2;5;fi
011000002;;2,0;en
011100009
011110002;Hyl.;;fi
```

Ensimmäisellä rivillä on kaikki tiedot annettu yksityiskohtaisesti. Toisella rivillä arvosanaa ei ole annettu, joten merkinnäksi tulee hyväksytty. Laajuus ja kieli on merkitty ja ne merkitään sellaisenaan suoritukseen.
Kolmannella rivillä vain opiskelijanumero on annettu, joten arvosanaksi tulee hyväksytty, ja muut tiedot haetaan kurssin oletustiedoista. Neljännellä rivillä toimitaan samoin, paitsi että kurssisuoritus on hylätty, ja oletuskielen sijaan merkitään suorituskieleksi englanti.
