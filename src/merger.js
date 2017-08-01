const gdal = require('gdal')

class Merger {
    constructor(){

    }



    mergeTiles = function(){
        let driverPNG = gdal.drivers.get('PNG')
        let driverMEM = gdal.drivers.get('MEM')

        const tileSize = 255
        const inputIMG1 = 'png1.png'
        const inputIMG2 = 'png2.png'
        var dstImageName = 'png3.png'

        const image1Dataset = gdal.open(inputIMG1)
        const image2Dataset = gdal.open(inputIMG2)

        let destDataset = driverMEM.createCopy ( dstImageName, image1Dataset ) 


        let redBandPNG1 = image1Dataset.bands.get(1)
        let greenBandPNG1 = image1Dataset.bands.get(2)
        let blueBandPNG1 = image1Dataset.bands.get(3)
        let alphaBandPNG1 = image1Dataset.bands.get(4)

        let redBandPNG2 = image2Dataset.bands.get(1)
        let greenBandPNG2 = image2Dataset.bands.get(2)
        let blueBandPNG2 = image2Dataset.bands.get(3)
        let alphaBandPNG2 = image2Dataset.bands.get(4)

        let redBandDest = destDataset.bands.get(1)
        let greenBandDest = destDataset.bands.get(2)
        let blueBandDest = destDataset.bands.get(3)
        let alphaBandDest = destDataset.bands.get(4)

        let redPixelsIMG1 = redBandPNG1.pixels
        let greenPixelsIMG1 = greenBandPNG1.pixels
        let bluePixelsIMG1 = blueBandPNG1.pixels
        let alphaPixelsIMG1 = alphaBandPNG1.pixels

        let redPixelsIMG2 = redBandPNG2.pixels
        let greenPixelsIMG2 = greenBandPNG2.pixels
        let bluePixelsIMG2 = blueBandPNG2.pixels
        let alphaPixelsIMG2 = alphaBandPNG2.pixels

        let redPixelsDest = redBandDest.pixels
        let greenPixelsDest = greenBandDest.pixels
        let bluePixelsDest = blueBandDest.pixels
        let alphaPixelsDest = alphaBandDest.pixels

        // Read all the pixels
        for(let x = 0; x < tileSize; ++x){
            for(let y = 0; y < tileSize; ++y){
                let valueRed2 = redPixelsIMG2.get(x,y)
                let valueGreen2 = greenPixelsIMG2.get(x,y)
                let valueBlue2 = bluePixelsIMG2.get(x,y)
                let valueAlpha2 = alphaPixelsIMG2.get(x,y)
                if(valueRed2 !== 0 || valueGreen2 !== 0 || valueBlue2 !== 0){
                    redPixelsDest.set(x,y,valueRed2)
                    greenPixelsDest.set(x,y,valueGreen2)
                    bluePixelsDest.set(x,y,valueBlue2)
                    alphaPixelsDest.set(x,y,valueAlpha2)
                }
            }
        }

        let pngDataset = driverPNG.createCopy(dstImageName, destDataset)
        pngDataset.close()
    }

}
export {Merger}
