import Link from 'next/link'
import Gallery, { type GalleryTile } from '@/components/Gallery'

// Placeholder tiles: add an image (and alt text) to each as photos are ready.
// col/cols/row/rows place the tile in the mosaic, phoneCols/phoneRows size it on
// phones (see GalleryTile).
const tiles: GalleryTile[] = [
  { col: 2, cols: 3, row: 2, rows: 4, phoneCols: 1, phoneRows: 3 },
  { col: 5, cols: 4, row: 1, rows: 3, phoneCols: 1, phoneRows: 2 },
  { col: 9, cols: 2, row: 2, rows: 2, phoneCols: 1, phoneRows: 1 },
  { col: 11, cols: 2, row: 1, rows: 4, phoneCols: 1, phoneRows: 3 },
  { col: 1, cols: 4, row: 6, rows: 3, phoneCols: 2, phoneRows: 2 },
  { col: 5, cols: 3, row: 4, rows: 5, phoneCols: 1, phoneRows: 3 },
  { col: 8, cols: 3, row: 4, rows: 4, phoneCols: 1, phoneRows: 2 },
  { col: 11, cols: 3, row: 5, rows: 3, phoneCols: 1, phoneRows: 2 },
  { col: 8, cols: 4, row: 8, rows: 2, phoneCols: 2, phoneRows: 2 },
  { col: 12, cols: 2, row: 8, rows: 2, phoneCols: 1, phoneRows: 1 },
  { col: 2, cols: 6, row: 9, rows: 3, phoneCols: 2, phoneRows: 2 },
  { col: 8, cols: 3, row: 10, rows: 3, phoneCols: 1, phoneRows: 2 },
  { col: 11, cols: 3, row: 10, rows: 2, phoneCols: 1, phoneRows: 1 }
]

export default function GalleryPage () {
  return (
    <>
      <section>
        <h1>Gallery</h1>
        <Link href='/shop'><strong>Shop the available pieces</strong></Link>
      </section>

      <Gallery tiles={tiles} />
    </>
  )
}
