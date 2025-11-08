import TopBar from "@/components/common/TopBar";

const Home = () => {
  return (
    <>
      <TopBar />
      {/* Motto */}
      <div className="font-(family-name:--secondary-font) flex flex-col gap-4 justify-center flex-1 text-5xl xs:text-6xl sm:text-7xl lg:text-8xl font-extralight pb-24">
        Knowledge,
        <span className="block font-medium">re-explained.</span>
      </div>
    </>
  )
}

export default Home;