import puppeteer, { Browser } from 'puppeteer';

export class PdfService {
    private browserPromise: Promise<Browser> | null = null;

    private obtenerBrowser(): Promise<Browser> {
        if (!this.browserPromise) {
            this.browserPromise = puppeteer.launch({
                headless: true
            }).catch(error => {
                this.browserPromise = null;
                throw error;
            });
        }

        return this.browserPromise;
    }

    async generarDesdeHtml(html: string): Promise<Buffer> {
        const browser = await this.obtenerBrowser();
        const page = await browser.newPage();

        try {
            await page.setViewport({ width: 320, height: 800 });
            await page.setContent(html, { waitUntil: 'load' });
            await page.emulateMediaType('screen');

            const alturaContenido = await page.evaluate(() =>
                Math.ceil(document.documentElement.scrollHeight)
            );

            const pdf = await page.pdf({
                width: '320px',
                height: `${alturaContenido}px`,
                printBackground: true,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            });

            return Buffer.from(pdf);
        } finally {
            await page.close();
        }
    }
}
