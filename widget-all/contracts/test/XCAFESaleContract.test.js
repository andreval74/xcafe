const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XCAFESaleContract", function () {
  let contract;
  let usdtToken;
  let owner;
  let treasury;
  let backend;
  let user1;
  let user2;
  
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDT
  const COMMISSION_RATE = 200; // 2%
  const BASIS_POINTS = 10000;

  beforeEach(async function () {
    [owner, treasury, backend, user1, user2] = await ethers.getSigners();

    // Deploy mock USDT token
    const MockUSDT = await ethers.getContractFactory("MockERC20");
    usdtToken = await MockUSDT.deploy("Mock USDT", "USDT", 6, INITIAL_SUPPLY);
    await usdtToken.waitForDeployment();

    // Deploy XCAFE Sale Contract
    const XCAFESaleContract = await ethers.getContractFactory("XCAFESaleContract");
    contract = await XCAFESaleContract.deploy(
      await usdtToken.getAddress(),
      treasury.address,
      backend.address
    );
    await contract.waitForDeployment();

    // Transfer USDT to users for testing
    await usdtToken.transfer(user1.address, ethers.parseUnits("1000", 6));
    await usdtToken.transfer(user2.address, ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await contract.usdtToken()).to.equal(await usdtToken.getAddress());
      expect(await contract.treasuryWallet()).to.equal(treasury.address);
      expect(await contract.backendWallet()).to.equal(backend.address);
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.packageCounter()).to.equal(4); // 4 default packages
    });

    it("Should create default credit packages", async function () {
      const package1 = await contract.getCreditPackageInfo(1);
      expect(package1.credits).to.equal(100);
      expect(package1.price).to.equal(ethers.parseUnits("10", 6));
      expect(package1.active).to.be.true;

      const package2 = await contract.getCreditPackageInfo(2);
      expect(package2.credits).to.equal(500);
      expect(package2.price).to.equal(ethers.parseUnits("45", 6));
      expect(package2.active).to.be.true;
    });
  });

  describe("Credit Package Management", function () {
    it("Should allow owner to create new credit packages", async function () {
      await contract.createCreditPackage(2000, ethers.parseUnits("150", 6));
      
      const packageInfo = await contract.getCreditPackageInfo(5);
      expect(packageInfo.credits).to.equal(2000);
      expect(packageInfo.price).to.equal(ethers.parseUnits("150", 6));
      expect(packageInfo.active).to.be.true;
    });

    it("Should allow owner to update credit packages", async function () {
      await contract.updateCreditPackage(1, 150, ethers.parseUnits("12", 6), false);
      
      const packageInfo = await contract.getCreditPackageInfo(1);
      expect(packageInfo.credits).to.equal(150);
      expect(packageInfo.price).to.equal(ethers.parseUnits("12", 6));
      expect(packageInfo.active).to.be.false;
    });

    it("Should not allow non-owner to create packages", async function () {
      await expect(
        contract.connect(user1).createCreditPackage(1000, ethers.parseUnits("50", 6))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Credit Purchase", function () {
    beforeEach(async function () {
      // Approve USDT spending
      await usdtToken.connect(user1).approve(await contract.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("Should allow users to purchase credits", async function () {
      const packageId = 1;
      const operationTag = "test-purchase-001";
      
      await expect(
        contract.connect(user1).purchaseCredits(packageId, operationTag)
      ).to.emit(contract, "PurchaseCreated");

      const purchaseInfo = await contract.getPurchaseInfo(1);
      expect(purchaseInfo.buyer).to.equal(user1.address);
      expect(purchaseInfo.amount).to.equal(ethers.parseUnits("10", 6));
      expect(purchaseInfo.processed).to.be.false;
      expect(purchaseInfo.operationTag).to.equal(operationTag);
    });

    it("Should calculate commission correctly", async function () {
      const packageId = 1;
      const operationTag = "test-commission-001";
      const packagePrice = ethers.parseUnits("10", 6);
      const expectedCommission = (packagePrice * BigInt(COMMISSION_RATE)) / BigInt(BASIS_POINTS);
      
      await contract.connect(user1).purchaseCredits(packageId, operationTag);
      
      const purchaseInfo = await contract.getPurchaseInfo(1);
      expect(purchaseInfo.commission).to.equal(expectedCommission);
    });

    it("Should transfer correct amounts", async function () {
      const packageId = 1;
      const operationTag = "test-transfer-001";
      const packagePrice = ethers.parseUnits("10", 6);
      const commission = (packagePrice * BigInt(COMMISSION_RATE)) / BigInt(BASIS_POINTS);
      const netAmount = packagePrice - commission;
      
      const initialTreasuryBalance = await usdtToken.balanceOf(treasury.address);
      const initialContractBalance = await usdtToken.balanceOf(await contract.getAddress());
      
      await contract.connect(user1).purchaseCredits(packageId, operationTag);
      
      const finalTreasuryBalance = await usdtToken.balanceOf(treasury.address);
      const finalContractBalance = await usdtToken.balanceOf(await contract.getAddress());
      
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(netAmount);
      expect(finalContractBalance - initialContractBalance).to.equal(commission);
    });

    it("Should not allow duplicate operation tags", async function () {
      const packageId = 1;
      const operationTag = "duplicate-tag";
      
      await contract.connect(user1).purchaseCredits(packageId, operationTag);
      
      await expect(
        contract.connect(user2).purchaseCredits(packageId, operationTag)
      ).to.be.revertedWith("Operation tag already used");
    });

    it("Should not allow empty operation tags", async function () {
      const packageId = 1;
      
      await expect(
        contract.connect(user1).purchaseCredits(packageId, "")
      ).to.be.revertedWith("Operation tag cannot be empty");
    });

    it("Should not allow invalid package IDs", async function () {
      await expect(
        contract.connect(user1).purchaseCredits(999, "test-invalid")
      ).to.be.revertedWith("Invalid package ID");
    });
  });

  describe("Purchase Processing", function () {
    beforeEach(async function () {
      await usdtToken.connect(user1).approve(await contract.getAddress(), ethers.parseUnits("1000", 6));
      await contract.connect(user1).purchaseCredits(1, "test-process-001");
    });

    it("Should allow backend to process purchases", async function () {
      await expect(
        contract.connect(backend).processPurchase(1, 1)
      ).to.emit(contract, "PurchaseProcessed");

      const userCredits = await contract.getUserCredits(user1.address);
      expect(userCredits).to.equal(100);

      const purchaseInfo = await contract.getPurchaseInfo(1);
      expect(purchaseInfo.processed).to.be.true;
    });

    it("Should not allow non-backend to process purchases", async function () {
      await expect(
        contract.connect(user1).processPurchase(1, 1)
      ).to.be.revertedWith("Only backend can call this");
    });

    it("Should not allow processing the same purchase twice", async function () {
      await contract.connect(backend).processPurchase(1, 1);
      
      await expect(
        contract.connect(backend).processPurchase(1, 1)
      ).to.be.revertedWith("Purchase already processed");
    });
  });

  describe("Credit Management", function () {
    it("Should allow backend to use credits", async function () {
      // Add credits first
      await contract.addCredits(user1.address, 100);
      
      await expect(
        contract.connect(backend).useCredits(user1.address, 50, "API Call")
      ).to.emit(contract, "CreditsUsed");

      const remainingCredits = await contract.getUserCredits(user1.address);
      expect(remainingCredits).to.equal(50);
    });

    it("Should not allow using more credits than available", async function () {
      await contract.addCredits(user1.address, 50);
      
      await expect(
        contract.connect(backend).useCredits(user1.address, 100, "API Call")
      ).to.be.revertedWith("Insufficient credits");
    });

    it("Should allow owner to add credits manually", async function () {
      await expect(
        contract.addCredits(user1.address, 500)
      ).to.emit(contract, "CreditsAdded");

      const userCredits = await contract.getUserCredits(user1.address);
      expect(userCredits).to.equal(500);
    });
  });

  describe("Commission Withdrawal", function () {
    beforeEach(async function () {
      // Generate some commissions
      await usdtToken.connect(user1).approve(await contract.getAddress(), ethers.parseUnits("1000", 6));
      await contract.connect(user1).purchaseCredits(1, "commission-test-001");
    });

    it("Should allow owner to withdraw commissions", async function () {
      const initialOwnerBalance = await usdtToken.balanceOf(owner.address);
      const commissionBalance = await contract.getAccumulatedCommissions();
      
      await expect(
        contract.withdrawCommissions()
      ).to.emit(contract, "CommissionWithdrawn");

      const finalOwnerBalance = await usdtToken.balanceOf(owner.address);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(commissionBalance);
    });

    it("Should not allow non-owner to withdraw commissions", async function () {
      await expect(
        contract.connect(user1).withdrawCommissions()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update treasury wallet", async function () {
      await contract.updateTreasuryWallet(user1.address);
      expect(await contract.treasuryWallet()).to.equal(user1.address);
    });

    it("Should allow owner to update backend wallet", async function () {
      await contract.updateBackendWallet(user1.address);
      expect(await contract.backendWallet()).to.equal(user1.address);
    });

    it("Should allow owner to pause/unpause contract", async function () {
      await contract.pause();
      expect(await contract.paused()).to.be.true;
      
      await contract.unpause();
      expect(await contract.paused()).to.be.false;
    });

    it("Should not allow purchases when paused", async function () {
      await contract.pause();
      await usdtToken.connect(user1).approve(await contract.getAddress(), ethers.parseUnits("1000", 6));
      
      await expect(
        contract.connect(user1).purchaseCredits(1, "paused-test")
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("View Functions", function () {
    it("Should return correct active packages", async function () {
      // Deactivate package 1
      await contract.updateCreditPackage(1, 100, ethers.parseUnits("10", 6), false);
      
      const activePackages = await contract.getActivePackages();
      expect(activePackages.length).to.equal(3);
      expect(activePackages).to.not.include(1);
    });

    it("Should check operation tag usage correctly", async function () {
      const tag = "test-tag-check";
      
      expect(await contract.isOperationTagUsed(tag)).to.be.false;
      
      await usdtToken.connect(user1).approve(await contract.getAddress(), ethers.parseUnits("1000", 6));
      await contract.connect(user1).purchaseCredits(1, tag);
      
      expect(await contract.isOperationTagUsed(tag)).to.be.true;
    });
  });
});