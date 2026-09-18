# 🧮 Contest Rules & Ranking Engine Algorithm

[⬅️ Back to Main README](../README.md) \| [🚀 Setup Guide](./SETUP_GUIDE.md) \| [🏗️ Architecture](./ARCHITECTURE.md) \| [🖥️ DB Inspection](./DATABASE_INSPECTION.md) \| [📡 API Ref](./API_REFERENCE.md)

This document defines the mathematical scoring formula, tie-breaker order, 33-prize priority allocation rules, multi-category cascade logic, and real-time KYC disqualification rules.

---

## 📊 1. Engagement Score Formula

$$\text{Score} = (\text{Likes} \times 1.0) + (\text{Comments} \times 3.0) + (\text{Views} \times 0.2)$$

### Example Calculation:
- **Likes**: `450` $\rightarrow 450 \times 1.0 = 450.0$
- **Comments**: `90` $\rightarrow 90 \times 3.0 = 270.0$
- **Views**: `1500` $\rightarrow 1500 \times 0.2 = 300.0$
- **Final Post Score**: $450.0 + 270.0 + 300.0 = 1020.0$

---

## ⚖️ 2. Deterministic Tie-Breaker Precedence

If two or more posts produce the exact same final score (e.g. `150.0`), the system breaks the tie deterministically using the following order:

1. **Higher Comments Count**: Creator with more comments wins.
2. **Higher Views Count**: If comments are equal, creator with more views wins.
3. **Earliest Post Created At Date**: If comments and views are equal, the earlier posted reel wins.

---

## 🏆 3. 33 Prizes Priority Allocation Hierarchy

A creator can win **at most ONE prize** across the entire contest. Prizes are allocated strictly in order of priority:

| Rank Index | Prize Category | Count | Description / Eligibility |
| :--- | :--- | :--- | :--- |
| **1** | **Grand Prize** | 1 | Highest post score across all eligible Chhattisgarh creators. |
| **2 - 3** | **Consistency 1st & 2nd** | 2 | Top 2 creators by consistency score (must post 3+ reels EVERY week for 4 weeks). |
| **4 - 13** | **Top Performers (#1 - #10)** | 10 | Next 10 distinct creators with the highest single-post scores. |
| **14 - 23** | **Category 1st Winners** | 10 | 1 winner per category (`Tech`, `Art`, `Music`, `Gaming`, `Fitness`, `Food`, `Travel`, `Fashion`, `Education`, `Entertainment`). |
| **24 - 33** | **Category 2nd Winners** | 10 | 2nd place winner per category. Left `UNAWARDED` if no eligible creator remains. |

---

## 🔀 4. Multi-Category Leader Rule

If a creator has the highest score in multiple categories (e.g., Ananya has top post in both `Tech` and `Fashion`):
- The creator is awarded **ONLY their strongest category** (where their single post score is highest).
- Their slot in the other category **cascades down** to the next eligible creator in that category!

---

## 🚫 5. Real-Time KYC Disqualification Cascade Rule

1. When Admin marks a winner's KYC status as `FAILED`:
   - The creator's user ID is added to the disqualification set (`disqSet`).
2. The ranking engine immediately re-computes the entire contest ranking:
   - Disqualified creator is removed from the prize table.
   - All subsequent category and consistency slots **cascade deterministically**, promoting the next eligible creator in real-time!
3. An entry is recorded in the PostgreSQL `KycAuditLog` table:
   - Capturing `winnerId`, `userEmail`, `previousStatus`, `newStatus`, `reason`, and timestamp.
