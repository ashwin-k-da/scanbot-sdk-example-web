
// Import SDK from webpack directory to ensure web assembly binary and worker and bundled with webpack
import ScanbotSDK from "scanbot-web-sdk/webpack";

// Other typings should be imported from @types
import {
    DocumentScannerConfiguration,
    IDocumentScannerHandle,
    CroppingViewConfiguration,
    ICroppingViewHandle,
    BarcodeScannerConfiguration,
    IBarcodeScannerHandle,
    BinarizationFilter,
    ColorFilter,
    ImageFilter,
    TiffGenerationOptions,
    PdfGenerationOptions,
    TiffGenerator,
    PdfGenerator,
} from "scanbot-web-sdk/@types";

import Pages from "../model/pages";
import { ImageUtils } from "../utils/image-utils";
import { BarcodeFormat } from "scanbot-web-sdk/@types/model/barcode/barcode-format";


export class ScanbotSdkService {

    static DOCUMENT_SCANNER_CONTAINER = "document-scanner-view";
    static CROPPING_VIEW_CONTAINER = "cropping-view";
    static BARCODE_SCANNER_CONTAINER = "barcode-scanner-view";

    public static instance = new ScanbotSdkService();

    license =
        "e3k9YHlX9mXAXjeLeZoXRmxt/sNa7l" +
        "cwWWgw8PdJ7P0q7id7kuwH/sfMkfxS" +
        "yScnz/Lsy58v8sOoMk2fzFW3A+gZzK" +
        "lh76mLUo0Wi5ylkTmVWE4t+903Ayex" +
        "GQRlkHRVTLa3yAXs7dz1zuQmnNkKx5" +
        "llZKOucD40ks6TN1uEKalN8YMp1/OX" +
        "hFjAOcIlx5rRJWiBrSrxnwbCuh6nnJ" +
        "4OwQ3jF4YX0RFXpcC0tfluWJcEGubp" +
        "m4ZCjnG1/+E1ue12dbGImTrBftVA8u" +
        "ObL46HZhSz7qWxRgxT2kAAFb0KHi3z" +
        "Z6rPJdEi5tsovGudqD9ZODwGlsiSk4" +
        "6zTWQ2uSs7yQ==\nU2NhbmJvdFNESw" +
        "psb2NhbGhvc3R8YXdlc29tZS1zd2ly" +
        "bGVzLThjNTFhNy5uZXRsaWZ5LmFwcA" +
        "oxNjMzNzM3NTk5CjgzODg2MDcKOA==\n";

    sdk?: ScanbotSDK;

    documentScanner?: IDocumentScannerHandle;
    barcodeScanner?: IBarcodeScannerHandle;
    croppingView?: ICroppingViewHandle;

    public async initialize() {
        this.sdk = await ScanbotSDK.initialize({ licenseKey: this.license, engine: "/" });
        return this.sdk;
    }

    async setLicenseFailureHandler(callback: any) {
        await this.setLicenceTimeout(callback);
    }

    private async setLicenceTimeout(callback: any) {
        // Scanbot WebSDK does not offer real-time license failure handler. Simply loop to check it manually
        const info = await this.sdk?.getLicenseInfo();
        if (info && info.status !== "Trial" && info.status !== "Okay") {
            callback(info.description);
        } else {
            setTimeout(() => {
                this.setLicenceTimeout(callback);
            }, 2000);
        }

    }
    public async isLicenseValid(): Promise<boolean> {
        const info = await this.sdk?.getLicenseInfo();
        if (!info) {
            return false;
        }
        return info.status === "Trial" || info.status === "Okay";
    }

    public async createDocumentScanner(detectionCallback: any) {
        const config: DocumentScannerConfiguration = {
            onDocumentDetected: detectionCallback,
            containerId: ScanbotSdkService.DOCUMENT_SCANNER_CONTAINER,
            text: {
                hint: {
                    OK: "Capturing your document...",
                    OK_SmallSize: "The document is too small. Try moving closer.",
                    OK_BadAngles: "This is a bad camera angle. Hold the device straight over the document.",
                    OK_BadAspectRatio: "Rotate the device sideways, so that the document fits better into the screen.",
                    OK_OffCenter: "Try holding the device at the center of the document.",
                    Error_NothingDetected: "Please hold the device over a document to start scanning.",
                    Error_Brightness: "It is too dark. Try turning on a light.",
                    Error_Noise: "Please move the document to a clear surface.",
                }
            },
        };

        if (this.sdk) {
            this.documentScanner = await this.sdk!.createDocumentScanner(config);
        }
    }

    public disposeDocumentScanner() {
        this.documentScanner?.dispose();
    }

    public async createBarcodeScanner(callback: any) {
        const barcodeFormats: BarcodeFormat[] = [
            "AZTEC",
            "CODABAR",
            "CODE_39",
            "CODE_93",
            "CODE_128",
            "DATA_MATRIX",
            "EAN_8",
            "EAN_13",
            "ITF",
            "MAXICODE",
            "PDF_417",
            "QR_CODE",
            "RSS_14",
            "RSS_EXPANDED",
            "UPC_A",
            "UPC_E",
            "UPC_EAN_EXTENSION",
            "MSI_PLESSEY"
        ];

        const config: BarcodeScannerConfiguration = {
            containerId: ScanbotSdkService.BARCODE_SCANNER_CONTAINER,
            captureDelay: 1000,
            onBarcodesDetected: callback,
            barcodeFormats: barcodeFormats,
        };
        if (this.sdk) {
            this.barcodeScanner = await this.sdk!.createBarcodeScanner(config);
        }
    }

    public disposeBarcodeScanner() {
        this.barcodeScanner?.dispose();
    }

    public async openCroppingView(page: any) {
        const configuration: CroppingViewConfiguration = {
            containerId: ScanbotSdkService.CROPPING_VIEW_CONTAINER,
            image: page.original,
            polygon: page.polygon,
            rotations: page.rotations ?? 0
        };

        this.croppingView = await this.sdk!.openCroppingView(configuration);
    }

    public disposeCroppingView() {
        this.croppingView?.dispose();
    }

    public binarizationFilters(): BinarizationFilter[] {
        return [
            'binarized',
            'otsuBinarization',
            'pureBinarized',
            'lowLightBinarization',
            'lowLightBinarization2',
            'deepBinarization'
        ];
    }

    public colorFilters(): ColorFilter[] {
        return [
            'color',
            'gray',
            'colorDocument',
            'blackAndWhite',
            'edgeHighlight'
        ];
    }

    public availableFilters(): string[] {
        return ["none"].concat(this.binarizationFilters()).concat(this.colorFilters());
    }
    filterByIndex(value: string) {
        return this.availableFilters()[parseInt(value)];
    }

    public async applyFilter(image: ArrayBuffer, filter: ImageFilter) {
        return await this.sdk!.applyFilter(image, filter);
    }

    async documentImageAsBase64(index: number) {
        const bytes = Pages.instance.imageAtIndex(index);
        if (bytes) {
            return await this.sdk!.toDataUrl(bytes);
        }
    }

    async reapplyFilter() {
        const existing = Pages.instance.getActiveItem();
        if (!existing.filter) {
            return;
        }
        existing.filtered = await this.applyFilter(existing.cropped, existing.filter);
    }

    async generatePDF(pages: any[]) {
        // When scaling down an image, also lower the dots-per-inch parameter. Else it won't fill the page
        const options: PdfGenerationOptions = { standardPaperSize: "A4", landscape: true, dpi: 1 };
        const generator: PdfGenerator = await this.sdk!.beginPdf(options);
        for (const page of pages) {
            let image = page.filtered ?? page.cropped ?? page.original;
            image = await ImageUtils.downscale(this.sdk!, image);
            await generator.addPage(image);
        }
        return await generator.complete();
    }

    async generateTIFF(pages: any[]) {
        const options: TiffGenerationOptions = { binarizationFilter: "deepBinarization", dpi: 123 };
        const generator: TiffGenerator = await this.sdk!.beginTiff(options);
        for (const page of pages) {
            await generator.addPage(page.cropped ?? page.original);
        }
        return await generator.complete();
    }
}
