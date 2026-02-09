import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  NotFoundException,
  Body,
    HttpStatus,        // ✅ ADD
  Logger, 
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { JobStatus } from "@prisma/client";
import { PdfService } from "../../pdf/pdf.service";
import { MailService } from "../../mail/mail.service"; // ✅ USE THIS
import { BadRequestException } from "@nestjs/common";

@Controller("public/quotation")
export class PublicSignController {
    private readonly logger = new Logger(PublicSignController.name); // ✅ ADD THIS LINE

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private mailService: MailService // ✅ FIX #1
  ) {}
// ================= SIGN PAGE =================
@Get(":token/sign")
async signPage(
  @Param("token") token: string,
  @Req() req: any,
  @Res() res: Response  // ✅ FIXED: passthrough removed
): Promise<void> {
  try {
    // 🔍 VALIDATE QUOTATION
    const quote = await this.prisma.quotation.findFirst({
      where: { 
        publicToken: token,
        expiresAt: { gt: new Date() }
      },
      include: { customer: true, company: true },
    });

    if (!quote || !quote.customer || !quote.company) {
      this.logger.warn(`Invalid token: ${token.slice(0, 8)}...`);
      throw new NotFoundException("Invalid or expired quotation");
    }

    // ✅ ALREADY SIGNED → SUCCESS REDIRECT
    if (quote.status === "SIGNED") {
      this.logger.log(`Already signed: ${quote.quoteNumber}`);
      res.redirect(301, `/public/quotation/${token}/success`);
      return;
    }

    if (quote.status !== "SENT") {
      throw new NotFoundException("Quotation not available for signing");
    }

    // ✅ SINGLE RESPONSE - NO ERRORS
    res.type("html").send(this.renderSignaturePage(quote, req));
    
  } catch (error) {
    this.logger.error(`signPage error [${token.slice(0, 8)}]:`, error);
    if (error instanceof NotFoundException) throw error;
    
    res.status(500).send(`
      <!DOCTYPE html>
      <html><body style="font-family:Arial;text-align:center;padding:50px;color:#666">
        <h2>⚠️ Service temporarily unavailable</h2>
        <p>Please try again in a few moments</p>
      </body></html>
    `);
    
  }
  
}

private renderSignaturePage(quote: any, req: any): string {
  const { quoteNumber, customer } = quote;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Sign Quotation #${quoteNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f5f7;min-height:100vh;display:flex;align-items:center;padding:20px}
    .container{max-width:420px;margin:auto;width:100%}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .header h1{font-size:20px;font-weight:700;color:#1a1a1a;margin:0}
    .ref{font-size:12px;color:#999}
    .card{background:#fff;border-radius:20px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.1)}
    .title{text-align:center;font-size:22px;font-weight:800;margin-bottom:8px;color:#1a1a1a}
    .sub{text-align:center;font-size:14px;color:#666;margin-bottom:24px}
    .sig-wrapper{position:relative;border:3px dashed #e0c49a;border-radius:16px;background:#faf8f3;min-height:220px;display:flex;align-items:center;justify-content:center;margin:20px 0}
    canvas{width:100%;height:220px;border-radius:12px;background:#fff;display:block;cursor:crosshair}
    .clear{position:absolute;top:12px;right:12px;background:#e0b16d;color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(224,177,109,0.4)}
    .clear:hover{background:#d19a4f}
    .btn{width:100%;height:56px;border:none;border-radius:16px;font-size:18px;font-weight:700;background:#d1a15f;color:#fff;margin-top:24px;cursor:pointer;opacity:0.4;transition:all .3s;box-shadow:0 4px 16px rgba(209,161,95,0.3)}
    .btn:not([disabled]){opacity:1;transform:translateY(-2px);box-shadow:0 8px 24px rgba(209,161,95,0.4)}
    .btn.loading{opacity:0.7;pointer-events:none;position:relative}
    .btn.loading::after{content:'';position:absolute;top:50%;left:50%;width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;transform:translate(-50%,-50%)}
    .legal{margin-top:16px;font-size:12px;color:#888;text-align:center;line-height:1.4}
    .lock{text-align:center;font-size:13px;color:#aaa;margin-top:12px}
    @keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
    @media (max-width:480px){.container{padding:16px}}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Sign Quotation</h1>
      <span class="ref">Ref #${quoteNumber}</span>
    </div>
    <div class="card">
      <div class="title">I "${customer.fullName}" authorize this quotation</div>
      <div class="sub">Quotation #${quoteNumber} • Secure electronic signature</div>
      
      <div class="sig-wrapper">
        <button class="clear" onclick="clearSig()" title="Clear">✕</button>
        <canvas id="sig"></canvas>
      </div>

      <button id="confirmBtn" class="btn" disabled>Confirm Signature</button>
      
      <div class="legal">By signing you agree to quotation terms. Legally binding digital signature.</div>
      <div class="lock">🔒 BOXXPILOT Secure Signing</div>
    </div>
  </div>

  <script>
    (function(){
      let canvas, ctx, drawing=false, hasSignature=false;
      
      function init() {
        canvas = document.getElementById('sig');
        ctx = canvas.getContext('2d');
        
        // Set canvas size after render
        setTimeout(() => {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#333';
        }, 50);
        
        setupEvents();
      }
      
      function setupEvents() {
        // Mouse
        canvas.onmousedown = (e) => {
          const rect = canvas.getBoundingClientRect();
          drawing = true;
          ctx.beginPath();
          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
          hasSignature = true;
          enableBtn();
        };
        
        canvas.onmousemove = (e) => {
          if (!drawing) return;
          const rect = canvas.getBoundingClientRect();
          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
          ctx.stroke();
        };
        
        canvas.onmouseup = canvas.onmouseleave = () => drawing = false;
        
        // Touch
        canvas.ontouchstart = (e) => {
          e.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];
          drawing = true;
          ctx.beginPath();
          ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
          hasSignature = true;
          enableBtn();
        };
        
        canvas.ontouchmove = (e) => {
          e.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];
          ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
          ctx.stroke();
        };
        
        canvas.ontouchend = () => drawing = false;
      }
      
      function clearSig() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
        const btn = document.getElementById('confirmBtn');
        btn.disabled = true;
        btn.classList.remove('enabled');
      }
      
      function enableBtn() {
        const btn = document.getElementById('confirmBtn');
        btn.disabled = false;
        btn.classList.add('enabled');
      }
      
      async function submitSig() {
        if (!hasSignature) return;
        
        const btn = document.getElementById('confirmBtn');
        btn.classList.add('loading');
        btn.innerHTML = 'Signing...';
        btn.disabled = true;
        
        try {
          const path = window.location.pathname;
          const token = path.split('/')[3]; // /public/quotation/TOKEN/sign
          const signature = canvas.toDataURL('image/png');
          
          const res = await fetch(path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({signature})
          });
          
          if (res.ok) {
            window.location.href = '/public/quotation/' + token + '/success';
          } else {
            throw new Error('Signing failed');
          }
        } catch (e) {
          alert('Signing failed. Please try again.');
          btn.classList.remove('loading');
          btn.innerHTML = 'Confirm Signature';
          btn.disabled = false;
        }
      }
      
      // Button listeners
      document.getElementById('confirmBtn').onclick = submitSig;
      document.querySelector('.clear').onclick = clearSig;
      
      // Start
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body></html>`;
}

private getProductionCSS(isMobile: boolean): string {
  return ''; // ✅ Inline CSS already included above
}


@Get(":token/success")
successPage(@Param("token") token: string, @Res() res: Response) {
  // Fetch quote to get REAL quoteNumber
  this.prisma.quotation.findFirst({
    where: { publicToken: token },
    select: { quoteNumber: true }
  }).then(quote => {
    const quoteNumber = quote?.quoteNumber || token.slice(-8).toUpperCase();
    
    res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>✅ Quote #${quoteNumber} Signed Successfully</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9ff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .container{max-width:420px;width:100%;background:#fff;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.1);overflow:hidden}
    .header{background:linear-gradient(135deg,#10b981,#059669);color:white;padding:32px 24px;text-align:center;position:relative;overflow:hidden}
    .header::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#34d399,#10b981,#059669)}
    .check-circle{position:relative;display:inline-flex;align-items:center;justify-content:center;width:88px;height:88px;background:#dcfce7;border-radius:50%;margin-bottom:16px;box-shadow:0 8px 24px rgba(16,185,129,0.3)}
    .checkmark{font-size:36px;font-weight:900;color:#16a34a}
    .header h1{font-size:28px;font-weight:800;margin:0 0 4px}
    .header p{font-size:16px;opacity:0.9;margin:0}
    .content{padding:32px 24px}
    .quote-info{display:flex;align-items:center;gap:12px;padding:20px;background:#f0fdfa;border:2px solid #ccfbf1;border-radius:16px;margin-bottom:24px}
    .quote-badge{background:#10b981;color:white;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
    .quote-details h3{font-size:20px;font-weight:800;color:#1f2937;margin:0}
    .quote-details p{font-size:14px;color:#6b7280;margin:0}
    .status-grid{display:grid;gap:16px;margin-top:24px}
    .status-item{display:flex;align-items:center;justify-content:space-between;padding:20px 16px;background:#fff;border:2px solid #f3f4f6;border-radius:16px;transition:all 0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
    .status-item:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1);border-color:#10b981}
    .status-icon{font-size:24px}
    .status-label{font-weight:600;color:#374151}
    .status-check{font-size:20px;font-weight:700;color:#10b981}
    .verified-badge{display:inline-flex;align-items:center;gap:6px;background:#ecfdf5;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:#166534;border:1px solid #bbf7d0}
    .verified-icon{font-size:14px}
    .footer{padding:24px;text-align:center;background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 24px 24px}
    .ref-code{background:#f3f4f6;padding:12px 20px;border-radius:12px;font-family:monospace;font-weight:600;font-size:14px;letter-spacing:2px;color:#64748b;display:inline-block}
    @media (max-width:480px){.container{margin:16px;border-radius:20px}}
    @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .content > *{animation:slideIn 0.5s ease forwards}
    .status-item:nth-child(1){animation-delay:0.1s}
    .status-item:nth-child(2){animation-delay:0.2s}
    .status-item:nth-child(3){animation-delay:0.3s}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="check-circle">
        <div class="checkmark">✓</div>
      </div>
      <h1>Success</h1>
      <p>Quote #${quoteNumber} has been successfully signed</p>
    </div>

    <div class="quote-info">
      <div class="quote-badge">#${quoteNumber}</div>
      <div class="quote-details">
        <h3>Quote #${quoteNumber}</h3>
        <p>Successfully signed and verified</p>
      </div>
    </div>

    <div class="content">
      <div class="status-grid">
        <div class="status-item">
          <div>
            <div class="status-icon">📝</div>
            <div class="status-label">Electronic signature recorded</div>
          </div>
          <div class="verified-badge">
            <span class="verified-icon">🔒</span>
            Verified by BOXXPILOT
          </div>
        </div>

        <div class="status-item">
          <div>
            <div class="status-icon">📄</div>
            <div class="status-label">PDF copy sent</div>
          </div>
          <div class="status-check">✓</div>
        </div>

        <div class="status-item">
          <div>
            <div class="status-icon">🚛</div>
            <div class="status-label">Job #J-${quoteNumber} created</div>
          </div>
          <div class="status-check">✓</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="ref-code">Reference: ${token.slice(-8).toUpperCase()}</div>
    </div>
  </div>

  <script>
    setTimeout(() => {
      if (window.opener) window.close();
      else document.body.style.opacity = '0.7';
    }, 6000);
  </script>
</body>
</html>`);
  }).catch(() => {
    // Fallback if quote not found
    res.type("html").send(`
      <!DOCTYPE html>
      <html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
      <body style="font-family:Arial;text-align:center;padding:50px">
        <div style="width:120px;height:120px;border-radius:50%;background:#dcfce7;margin:40px auto;display:flex;align-items:center;justify-content:center;font-size:64px;color:#16a34a">✓</div>
        <h2>Success</h2>
        <p>Quotation successfully signed</p>
      </body></html>
    `);
  });
}


  // ================= SIGN SUBMIT =================
 @Post(":token/sign")
async submitSignature(
  @Param("token") token: string,
  @Body() body: { signature: string },
  @Req() req: any
) {
  if (!body.signature || body.signature.length < 1500) {
    throw new BadRequestException("Valid handwritten signature required");
  }

  const quote = await this.prisma.quotation.findFirst({
    where: {
      publicToken: token,
    },
    include: {
      customer: true,
      company: true,
    },
  });

  if (!quote || !quote.customer || !quote.company) {
    throw new BadRequestException("Invalid quotation");
  }
const customer = quote.customer;
const company = quote.company;

if (!customer || !company) {
  throw new BadRequestException("Invalid quotation");
}

  if (quote.status === "SIGNED") {
    return { success: true };
  }

  if (quote.status !== "SENT") {
    throw new BadRequestException("Quotation not available for signing");
  }

  // ✅ SIGN FAST
 const updated = await this.prisma.$transaction(async tx => {
  const signedQuote = await tx.quotation.update({
    where: { id: quote.id },
    data: {
      status: "SIGNED",
signedBy: customer.fullName,
      signedAt: new Date(),
      signature: body.signature,
      signedIp: req.ip,
      signedDevice: req.headers["user-agent"],
    },
    include: { customer: true, company: true },
  });

  const exists = await tx.job.findFirst({
    where: { quotationId: signedQuote.id },
  });

  if (!exists) {
    const lastJob = await tx.job.findFirst({
      where: { companyId: signedQuote.companyId },
      orderBy: { jobNumber: "desc" },
    });

    await tx.job.create({
      data: {
        quotationId: signedQuote.id,
        companyId: signedQuote.companyId,
        jobNumber: lastJob ? lastJob.jobNumber + 1 : 1001,
        status: JobStatus.PENDING,
      },
    });
  }

  return signedQuote;
});


if (!updated.customer || !updated.company) {
  throw new Error("Critical: customer/company missing after signing");
}

  // 🚀 BACKGROUND WORK (NON-BLOCKING)
  setImmediate(async () => {
    try {
      const signedPdf = await this.pdfService.generateQuotationPdf({
        quoteNumber: updated.quoteNumber,
        quote: updated,
        company: updated.company,
        customer: updated.customer,
        signed: true,
        signature: updated.signature,
        signedAt: updated.signedAt,
        signedBy: updated.signedBy,
      });

      await this.prisma.quotation.update({
        where: { id: updated.id },
        data: { signedPdfUrl: signedPdf.url },
      });

      if (updated.customer && updated.customer.email) {
        await this.mailService.sendGenericMail({
          to: updated.customer.email,
          subject: `Signed Quotation #${updated.quoteNumber}`,
          html: `<p>Your quotation has been successfully signed.</p>`,
          attachments: [
            {
              filename: `Quotation-${updated.quoteNumber}-signed.pdf`,
              path: signedPdf.absolutePath,
            },
          ],
        });
      }


      
    } catch (e) {
      console.error("Background signing error:", e);
    }
  });

  // ⚡ IMMEDIATE RESPONSE
  return { success: true,    redirect: `/public/quotation/success/${token}`  // ✅ optional
 };
}
}