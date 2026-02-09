import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Res,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Response } from "express";

@Controller("public/quotation")
export class PublicQuotationController {
  constructor(private prisma: PrismaService) {}

  @Get(":token")
  async view(
    @Param("token") token: string,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    const quote = await this.prisma.quotation.findFirst({
      where: {
        publicToken: token,
        status: "SENT",
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: true,
        company: true,
      },
    });

    if (!quote || !quote.customer) {
      throw new NotFoundException("Quotation expired or invalid");
    }

    res.status(200);
    res.type("html");

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Quote #Q-${quote.quoteNumber}</title>

<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #f2f3f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
  color: #222;
}

.container {
  max-width: 420px;
  margin: auto;
  padding: 16px 14px 120px;
}

/* ===== HEADER ===== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.header h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 800;
}

/* ===== CARD ===== */
.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}

/* ===== TEXT ===== */
.small { font-size: 12px; color: #777; }
.bold { font-weight: 700; }

/* ===== ITINERARY ===== */
.itinerary-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
}
.pickup { background: #1c7ed6; }
.dropoff { background: #fa5252; }

/* ===== MAP ===== */
.map {
  background: #e9ecef;
  height: 140px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 13px;
  margin-top: 12px;
}

/* ===== COSTS ===== */
.cost-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}
.cost-row strong { font-weight: 700; }

.total {
  font-size: 22px;
  font-weight: 900;
  color: #228be6;
  text-align: right;
}

/* ===== TERMS ===== */
.terms {
  display: flex;
  gap: 8px;
  font-size: 13px;
  margin-top: 12px;
}

/* ===== CTA ===== */
/* ===== CTA ===== */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 14px 16px 18px;
  border-top: 1px solid #eee;
}

.cta {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  transition: all 0.25s ease;
}

.cta.disabled {
  background: #e6e6e6;
  color: #aaa;
  pointer-events: none;
}

.cta.enabled {
  background: linear-gradient(135deg, #e0b16d, #d19a4c);
  color: #fff;
  box-shadow: 0 6px 14px rgba(209, 154, 76, 0.35);
}


.secure {
  text-align: center;
  font-size: 11px;
  color: #aaa;
  margin-top: 6px;
}
</style>
</head>

<body>

<div class="container">

  <!-- HEADER -->
  <div class="header">
    <h1>Quote #Q-${quote.quoteNumber}</h1>
    <div class="small">Valid for ${quote.validityDays ?? 30} days</div>
  </div>

  <!-- CUSTOMER -->
  <div class="card">
    <div class="small">Prepared for</div>
    <div class="bold">${quote.customer.fullName}</div>
    <div class="small">Created ${new Date(quote.createdAt).toDateString()}</div>
  </div>

  <!-- MOVE ITINERARY -->
  <div class="card">
    <div class="bold" style="margin-bottom:10px">MOVE Itinerary</div>

    <div class="itinerary-row">
      <div class="dot pickup"></div>
      <div>
        <div class="small">Pickup</div>
        <div>${quote.pickupAddress ?? "-"}</div>
      </div>
    </div>

    <div class="itinerary-row">
      <div class="dot dropoff"></div>
      <div>
        <div class="small">Dropoff</div>
        <div>${quote.dropoffAddress ?? "-"}</div>
      </div>
    </div>

    <div class="map">Map preview</div>
  </div>

  <!-- SERVICE & COSTS -->
  <div class="card">
    <div class="bold" style="margin-bottom:10px">Service & Costs</div>

    <div class="cost-row">
      <span>Moving Labor</span>
      <strong>$${((quote.hourlyRate ?? 0) * (quote.estimatedHours ?? 0)).toFixed(2)}</strong>
    </div>

    <div class="cost-row">
      <span>Travel Cost</span>
      <strong>$${quote.travelCost?.toFixed(2) ?? "0.00"}</strong>
    </div>

    <hr style="border:none;border-top:1px solid #eee;margin:10px 0" />

    <div class="cost-row">
      <span class="bold">Estimated Total</span>
      <span class="total">$${quote.total.toFixed(2)}</span>
    </div>

    <div class="small">Payment due upon completion</div>
  </div>

  <!-- TERMS -->
 <div class="card">
  <label class="terms">
    <input type="checkbox" id="acceptTerms" />
    <span>
      I accept the <u>Terms & Conditions</u>.
    </span>
  </label>
</div>


</div>

<!-- FOOTER CTA -->
<div class="footer">
  <div
    id="signBtn"
    class="cta disabled"
    onclick="goToSign()"
  >
    Tap to Sign Quote
  </div>

  <div class="secure">
     Secure document by BOXXPILOT
  </div>
</div>

<script>
const checkbox = document.getElementById("acceptTerms");
const btn = document.getElementById("signBtn");

checkbox.addEventListener("change", () => {
  if (checkbox.checked) {
    btn.classList.remove("disabled");
    btn.classList.add("enabled");
  } else {
    btn.classList.remove("enabled");
    btn.classList.add("disabled");
  }
});

function goToSign() {
  window.location.href = "/public/quotation/${quote.publicToken}/sign";
}
</script>

</body>
</html>
`);

  }
}
