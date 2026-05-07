import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private uploadDir: string;
  private s3Client: S3Client | null = null;
  private logger = new Logger(UploadsService.name);

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    
    // Fallback Local Storage Setup
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // S3 Setup
    const endpoint = this.configService.get('S3_ENDPOINT');
    const region = this.configService.get('S3_REGION') || 'auto';
    const accessKeyId = this.configService.get('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get('S3_SECRET_KEY');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        endpoint: endpoint ? endpoint : undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3 Storage is enabled.');
    } else {
      this.logger.log('S3 Storage is not configured. Falling back to local storage.');
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    const bucketName = this.configService.get('S3_BUCKET');

    // If S3 is configured, upload to S3
    if (this.s3Client && bucketName) {
      try {
        await this.s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read', // Depends on provider if supported
        }));
        
        // AWS S3 Virtual Hosted Style URL or Endpoint
        const endpoint = this.configService.get('S3_ENDPOINT');
        if (endpoint) {
          // Removes protocol to insert bucket name if necessary, or just use endpoint/bucket/file
           return `${endpoint.replace(/\/$/, '')}/${bucketName}/${filename}`;
        }
        return `https://${bucketName}.s3.${this.configService.get('S3_REGION')}.amazonaws.com/${filename}`;
      } catch (err) {
        this.logger.error(`S3 Upload Error: ${err}`);
        throw new Error('Dosya yüklenemedi.');
      }
    }

    // Fallback: Local Storage
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const apiUrl = this.configService.get('API_URL') || 'http://localhost:4000';
    return `${apiUrl}/uploads/${filename}`;
  }
}
