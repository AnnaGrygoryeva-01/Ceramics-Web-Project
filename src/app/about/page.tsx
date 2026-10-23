import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage () {
  return (
    <>
      <h1>About</h1>

      <p>
        Hi, I’m Anna, a ceramicist from Ukraine. Every piece I make is shaped,
        painted and glazed by hand, from the first lump of clay to the final
        firing. I work mostly with stoneware, building most pieces slowly by
        hand and throwing some on the wheel.
      </p>
      <p>
        My designs grow from Petrykivka painting, a centuries-old Ukrainian folk
        art recognised by UNESCO. It’s a style full of sweeping brushstroke
        leaves, blooming flowers and fine trails of dots, and I paint these
        motifs onto each piece freehand, mostly in deep cobalt blue on soft
        white. Working this way keeps me connected to home, and I love the idea
        of that small piece of Ukraine finding its way into someone’s everyday
        life.
      </p>
      <p>
        Alongside my ceramics, I also offer a small selection of cat-fur
        Petrykivka brushes, made with ethically sourced, cruelty-free fur, for
        anyone who would like to try this beautiful technique themselves.
      </p>
      <p>
        Because I work in small batches, each piece is one of a kind and there
        are only ever a few of each. Thank you for being here and for supporting
        handmade work. I hope something you find here brings a little beauty to
        your home.
      </p>
    </>
  )
}
