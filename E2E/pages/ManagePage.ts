import { Page } from "@playwright/test";
import { AdminHeaderComponent } from "./Admin/Components/AdminHeaderComponent";
import { AdminLeftSideBarComponent } from "./Admin/Components/AdminLeftSidebarComponent";
import { BrandCreatePage } from "./Admin/BrandCreatePage";
import { BrandsPage } from "./Admin/BrandsPage";
import { AdminDashboardPage } from "./Admin/DashboardPage";
import { UserCreatePage } from "./Admin/UserCreatePage";
import { UsersPage } from "./Admin/UsersPage";
import { BlogPage } from "./BlogPage";
import { FooterComponent } from "./components/FooterComponent";
import { HeaderComponent } from "./components/HeaderComponent";
import { ContactUsPage } from "./FooterPages/ContactUsPage";
import { CookiesPolicyPage } from "./FooterPages/CookiesPolicyPage";
import { PrivacyPolicyPage } from "./FooterPages/PrivacyPolicyPage";
import { SiteMapPage } from "./FooterPages/SiteMapPage";
import { TOSPage } from "./FooterPages/TOSPage";
import { HomePage } from "./HomePage";
import { DashboardPage } from "./LoggedIn/DashboardPage";
import { ProfilePage } from "./LoggedIn/ProfilePage";
import { SettingsPage } from "./LoggedIn/SettingsPage";
import { LoginPage } from "./LoginPage";
import { ForgotPasswordPage } from "./Password/ForgotPasswordPage";
import { ResetPasswordPage } from "./Password/ResetPasswordPage";
import { RegisterPage } from "./RegisterPage";

export default class ManagePage {
	constructor(private readonly page: Page) {}

	private _home?: HomePage;
	private _dashboard?: DashboardPage;
	private _profile?: ProfilePage;
	private _settings?: SettingsPage;
	private _login?: LoginPage;
	private _register?: RegisterPage;
	private _header?: HeaderComponent;
	private _footer?: FooterComponent;
	private _blog?: BlogPage;
	private _forgotPasswordPage?: ForgotPasswordPage;
	private _resetPasswordPage?: ResetPasswordPage;
	private _contactUsPage?: ContactUsPage;
	private _cookiesPage?: CookiesPolicyPage;
	private _privacyPage?: PrivacyPolicyPage;
	private _siteMapPage?: SiteMapPage;
	private _TOSPage?: TOSPage;
	private _adminHeader?: AdminHeaderComponent;
	private _adminSideBar?: AdminLeftSideBarComponent;
	private _adminDashboardPage?: AdminDashboardPage;
	private _usersPage?: UsersPage;
	private _userCreatePage?: UserCreatePage;
	private _brandsPage?: BrandsPage;
	private _brandCreatePage?: BrandCreatePage;

	get dashboardPage(): DashboardPage {
		return (this._dashboard ??= new DashboardPage(this.page));
	}

	get profilePage(): ProfilePage {
		return (this._profile ??= new ProfilePage(this.page));
	}

	get settingsPage(): SettingsPage {
		return (this._settings ??= new SettingsPage(this.page));
	}

	get loginPage(): LoginPage {
		return (this._login ??= new LoginPage(this.page));
	}

	get registerPage(): RegisterPage {
		return (this._register ??= new RegisterPage(this.page));
	}

	get homePage(): HomePage {
		return (this._home ??= new HomePage(this.page));
	}

	get header(): HeaderComponent {
		return (this._header ??= new HeaderComponent(this.page));
	}

	get footer(): FooterComponent {
		return (this._footer ??= new FooterComponent(this.page));
	}

	get blogPage(): BlogPage {
		return (this._blog ??= new BlogPage(this.page));
	}

	get forgotPasswordPage(): ForgotPasswordPage {
		return (this._forgotPasswordPage ??= new ForgotPasswordPage(this.page));
	}

	get resetPasswordPage(): ResetPasswordPage {
		return (this._resetPasswordPage ??= new ResetPasswordPage(this.page));
	}

	get contactUsPage(): ContactUsPage {
		return (this._contactUsPage ??= new ContactUsPage(this.page));
	}

	get cookiesPage(): CookiesPolicyPage {
		return (this._cookiesPage ??= new CookiesPolicyPage(this.page));
	}

	get privacyPage(): PrivacyPolicyPage {
		return (this._privacyPage ??= new PrivacyPolicyPage(this.page));
	}

	get siteMapPage(): SiteMapPage {
		return (this._siteMapPage ??= new SiteMapPage(this.page));
	}

	get TOSPage(): TOSPage {
		return (this._TOSPage ??= new TOSPage(this.page));
	}

	get adminHeader(): AdminHeaderComponent {
		return (this._adminHeader ??= new AdminHeaderComponent(this.page));
	}

	get adminSideBar(): AdminLeftSideBarComponent {
		return (this._adminSideBar ??= new AdminLeftSideBarComponent(this.page));
	}

	get adminDashboardPage(): AdminDashboardPage {
		return (this._adminDashboardPage ??= new AdminDashboardPage(this.page));
	}

	get usersPage(): UsersPage {
		return (this._usersPage ??= new UsersPage(this.page));
	}

	get userCreatePage(): UserCreatePage {
		return (this._userCreatePage ??= new UserCreatePage(this.page));
	}

	get brandsPage(): BrandsPage {
		return (this._brandsPage ??= new BrandsPage(this.page));
	}

	get brandCreatePage(): BrandCreatePage {
		return (this._brandCreatePage ??= new BrandCreatePage(this.page));
	}
}
