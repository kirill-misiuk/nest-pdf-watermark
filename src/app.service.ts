import { HttpService } from '@nestjs/axios';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { BlendMode, degrees, PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export const DEFAULT_WATERMARK_WIDTH_VALUE = 130;
export const DEFAULT_WATERMARK_HEIGHT_VALUE = 130;
export const WATERMARK_OPACITY = 0.12;

@Injectable()
export class AppService implements OnApplicationBootstrap {
  _pdf_folder_path: string;
  constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
  }
  async getHello(): Promise<string> {
    console.log(`${this._pdf_folder_path}/test.pdf`);
    await this.embedImages();
    return 'Hello World!';
  }

  async  embedImages() {
    const watermarkBuffer = await this.prepareWatermark();
    const fileBuffer = fs.readFileSync(`${this._pdf_folder_path}/39f1f73bef59d5fa75b7befbd88a2e6d.pdf`,{})
    const bytes = new Uint8Array(fileBuffer);
    const watermarkBytes = new Uint8Array(watermarkBuffer);
    const pdfDoc = await PDFDocument.load(bytes)
    const watermark = await pdfDoc.embedJpg(watermarkBytes);
    const pages = pdfDoc.getPages()
    for (let page of pages) {
      const { width, height } = page.getSize()
      for(let i = 0; i < height; i += 70) {
        for(let k = 0; k < width; k+= 70) {
          page.drawImage(watermark, {
            x: -20 + k,
            y: height / 2 + 300 - i ,
            opacity: 0.08,
          })
        }
    }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFile(`${this._pdf_folder_path}/test2.pdf`, pdfBytes,  e => console.log(e) );
  }
  async prepareWatermark(): Promise<Buffer> {
    const watermarkBuffer = await sharp('/home/INTEXSOFT/kirill.misiuk/work/back-lab/files/test1.jpg')
      .resize({
        width:  DEFAULT_WATERMARK_WIDTH_VALUE,
        height:  DEFAULT_WATERMARK_HEIGHT_VALUE,
      })
      .raw()
      .jpeg()
      .flatten({background: { r: 255, g: 255, b: 255 } })
      .toBuffer();
    return watermarkBuffer;
  }
  onApplicationBootstrap(): any {
    const pdfFilePath = this.configService.get('PDF_FILE_PATH')
    if(!pdfFilePath) {
      throw new Error('Can`t find file PDF_FILE_PATH in env file')
    }
    this._pdf_folder_path = pdfFilePath;
  }
}
