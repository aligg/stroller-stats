import '@testing-library/jest-dom'

import {render, screen} from '@testing-library/react'

import WrappedShareCard from '../../components/WrappedShareCard'

const baseData = {
    year: 2026,
    first_name: "Ali",
    distance_unit: "mile",
    stroller: {
        total_distance: 241401.6,
        run_distance: 185000,
        walk_distance: 56401.6,
        activity_count: 60,
        run_count: 40,
        walk_count: 20,
        longest: { distance: 21097, sport_type: "Run", start_date: "2026-04-06T15:00:00Z", title: "Half! #strollerstats" },
        busiest_month: { month: 5, distance: 40000 },
        average_run_speed: 2.75,
    },
    pack: null,
    leaderboard: { opted_in: true, rank: 41, participants: 132 },
}

const noRank = { opted_in: false, rank: null, participants: null }

describe("WrappedShareCard", () => {
    test("with pace and rank, busiest month moves to a note", () => {
        render(<WrappedShareCard data={baseData} />)
        expect(screen.getByText("STROLLER OUTINGS")).toBeInTheDocument()
        expect(screen.getByText("9:45 /mi")).toBeInTheDocument()
        expect(screen.getByText("#41 of 132")).toBeInTheDocument()
        expect(screen.queryByText("BUSIEST MONTH")).not.toBeInTheDocument()
        expect(screen.getByText("busiest month: May")).toBeInTheDocument()
    })

    test("without a rank, busiest month fills the grid", () => {
        render(<WrappedShareCard data={{ ...baseData, leaderboard: noRank }} />)
        expect(screen.getByText("AVG RUN PACE")).toBeInTheDocument()
        expect(screen.getByText("BUSIEST MONTH")).toBeInTheDocument()
        expect(screen.queryByText(/busiest month:/)).not.toBeInTheDocument()
    })

    test("walk-only without a rank keeps a 4-box grid and notes busiest month", () => {
        const stroller = { ...baseData.stroller, run_distance: 0, run_count: 0, average_run_speed: null }
        render(<WrappedShareCard data={{ ...baseData, stroller, leaderboard: noRank }} />)
        expect(screen.queryByText("AVG RUN PACE")).not.toBeInTheDocument()
        expect(screen.queryByText("BUSIEST MONTH")).not.toBeInTheDocument()
        expect(screen.getByText("busiest month: May")).toBeInTheDocument()
    })

    test("carrier miles show as a note", () => {
        render(<WrappedShareCard data={{ ...baseData, pack: { total_distance: 61000, activity_count: 14 } }} />)
        expect(screen.getByText("plus 37.9 miles in the carrier 💪")).toBeInTheDocument()
        expect(screen.queryByText("CARRIER")).not.toBeInTheDocument()
    })

    test("always shows the site", () => {
        render(<WrappedShareCard data={baseData} />)
        expect(screen.getByText("strollerstats.com")).toBeInTheDocument()
    })
})
