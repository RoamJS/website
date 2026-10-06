import { Catalog } from "@/components/catalog";
import { Featured } from "@/components/featured";

const Home = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-[1536px] px-5 md:px-8 xl:px-11">
    <Catalog featured={<Featured />} />
  </main>
);

export default Home;
