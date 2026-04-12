import { Page } from "@playwright/test";
import { AdminHeaderComponent } from "./Admin/Components/AdminHeaderComponent";
import { AdminLeftSideBarComponent } from "./Admin/Components/AdminLeftSidebarComponent";
import { BlogCategoriesPage } from "./Admin/Blog/BlogCategoriesPage";
import { BlogCategoryCreatePage } from "./Admin/Blog/BlogCategoryCreatePage";
import { BlogCategoryEditPage } from "./Admin/Blog/BlogCategoryEditPage";
import { BlogCategoryViewPage } from "./Admin/Blog/BlogCategoryViewPage";
import { BlogPostCreatePage } from "./Admin/Blog/BlogPostCreatePage";
import { BlogPostEditPage } from "./Admin/Blog/BlogPostEditPage";
import { BlogPostsPage } from "./Admin/Blog/BlogPostsPage";
import { TagCreatePage } from "./Admin/Blog/TagCreatePage";
import { TagEditPage } from "./Admin/Blog/TagEditPage";
import { TagsPage } from "./Admin/Blog/TagsPage";
import { TagViewPage } from "./Admin/Blog/TagViewPage";
import { BrandCreatePage } from "./Admin/Brands/BrandCreatePage";
import { BrandsPage } from "./Admin/Brands/BrandsPage";
import { AdminDashboardPage } from "./Admin/DashboardPage";
import { UserCreatePage } from "./Admin/Users/UserCreatePage";
import { UsersPage } from "./Admin/Users/UsersPage";
import { BlogCategoryPage } from "./BlogCategoryPage";
import { BlogPage } from "./BlogPage";
import { BlogPostDetailPage } from "./BlogPostDetailPage";
import { BlogTagPage } from "./BlogTagPage";
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
	private _blogCategoryPublicPage?: BlogCategoryPage;
	private _blogTagPublicPage?: BlogTagPage;
	private _blogPostDetailPage?: BlogPostDetailPage;
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
	private _tagsPage?: TagsPage;
	private _tagCreatePage?: TagCreatePage;
	private _tagEditPage?: TagEditPage;
	private _blogCategoriesPage?: BlogCategoriesPage;
	private _blogCategoryCreatePage?: BlogCategoryCreatePage;
	private _blogCategoryEditPage?: BlogCategoryEditPage;
	private _blogCategoryViewPage?: BlogCategoryViewPage;
	private _tagViewPage?: TagViewPage;
	private _blogPostsPage?: BlogPostsPage;
	private _blogPostCreatePage?: BlogPostCreatePage;
	private _blogPostEditPage?: BlogPostEditPage;

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

	get blogCategoryPublicPage(): BlogCategoryPage {
		return (this._blogCategoryPublicPage ??= new BlogCategoryPage(this.page));
	}

	get blogTagPublicPage(): BlogTagPage {
		return (this._blogTagPublicPage ??= new BlogTagPage(this.page));
	}

	get blogPostDetailPage(): BlogPostDetailPage {
		return (this._blogPostDetailPage ??= new BlogPostDetailPage(this.page));
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

	get tagsPage(): TagsPage {
		return (this._tagsPage ??= new TagsPage(this.page));
	}

	get tagCreatePage(): TagCreatePage {
		return (this._tagCreatePage ??= new TagCreatePage(this.page));
	}

	get tagEditPage(): TagEditPage {
		return (this._tagEditPage ??= new TagEditPage(this.page));
	}

	get tagViewPage(): TagViewPage {
		return (this._tagViewPage ??= new TagViewPage(this.page));
	}

	get blogCategoriesPage(): BlogCategoriesPage {
		return (this._blogCategoriesPage ??= new BlogCategoriesPage(this.page));
	}

	get blogCategoryCreatePage(): BlogCategoryCreatePage {
		return (this._blogCategoryCreatePage ??= new BlogCategoryCreatePage(this.page));
	}

	get blogCategoryEditPage(): BlogCategoryEditPage {
		return (this._blogCategoryEditPage ??= new BlogCategoryEditPage(this.page));
	}

	get blogCategoryViewPage(): BlogCategoryViewPage {
		return (this._blogCategoryViewPage ??= new BlogCategoryViewPage(this.page));
	}

	get blogPostsPage(): BlogPostsPage {
		return (this._blogPostsPage ??= new BlogPostsPage(this.page));
	}

	get blogPostCreatePage(): BlogPostCreatePage {
		return (this._blogPostCreatePage ??= new BlogPostCreatePage(this.page));
	}

	get blogPostEditPage(): BlogPostEditPage {
		return (this._blogPostEditPage ??= new BlogPostEditPage(this.page));
	}
}
