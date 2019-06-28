import React from 'react'
import { Message, List } from 'semantic-ui-react'

const exampleStyle = {
  textAlign: 'center'
}

export default () => (
  <Message data-cy="userguide" style={exampleStyle}>
    <div>
      Suoritustiedostossa suoritukset täytyy olla merkittynä muodossa:
      <br />
      <br />
      <strong>opiskelijanumero;arvosana;laajuus;kieli</strong>
      <br />
      <br />
      Esimerkiksi kaikki seuraavat rivit kelpaavat:
      <List>
        <List.Item>010000003;2;5;fi</List.Item>
        <List.Item>011000002;;2,0</List.Item>
        <List.Item>011100009</List.Item>
        <List.Item>011110002;;;fi</List.Item>
      </List>
      Vain opiskelijanumero on pakollinen, muut tiedot täydennetään tarvittaessa
      kurssin oletusarvoista. Oletusarvosana on "Hyv.".
      <br />
      <br />
      Mikäli et löydä tarvitsemaasi arvostelijaa tai kurssia valikosta, tai
      sinulla ei ole arvostelijatunnusta, ota yhteyttä grp-toska@cs.helsinki.fi.
    </div>
  </Message>
)
